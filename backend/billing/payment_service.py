from datetime import datetime, timezone
import hashlib
import hmac
import json
import logging
from typing import Any, Dict, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.core.config import get_settings
from backend.db.models import TransactionModel, UsageModel, UserModel
from backend.services.quota_service import PLAN_LIMITS

logger = logging.getLogger("datapilot.billing")
settings = get_settings()

PLANS_CATALOG: Dict[str, Dict[str, Any]] = {
    "free": {
        "tier": "free",
        "name": "Free Tier",
        "price_inr": 0,
        "price_usd": 0,
        "interval": "forever",
        "description": "Essential data profiling and exploratory analytics for students and testing.",
        "features": [
            "5 Datasets storage",
            "10 MB max file size",
            "25 Natural language queries / month",
            "5 Executive report exports",
            "Deterministic zero-hallucination calculations",
        ],
        "limits": PLAN_LIMITS["free"],
    },
    "starter": {
        "tier": "starter",
        "name": "Starter Plan",
        "price_inr": 299,
        "price_usd": 4.99,
        "interval": "month",
        "description": "Ideal for shop owners, online sellers, and freelance data analysts.",
        "features": [
            "25 Datasets storage",
            "25 MB max file size",
            "250 Natural language queries / month",
            "50 Executive report exports (HTML, Markdown)",
            "Multi-sheet Excel workbook analysis",
            "Outlier & anomaly detection suite",
        ],
        "limits": PLAN_LIMITS["starter"],
    },
    "pro": {
        "tier": "pro",
        "name": "Professional Plan",
        "price_inr": 999,
        "price_usd": 14.99,
        "interval": "month",
        "description": "For business intelligence teams and power analysts requiring high capacity.",
        "features": [
            "100 Datasets storage",
            "50 MB max file size",
            "1,000 Natural language queries / month",
            "250 Executive report exports",
            "Priority LLM processing",
            "PDF Reference Document Q&A (RAG)",
            "Full data transformation history & audit logs",
        ],
        "limits": PLAN_LIMITS["pro"],
    },
    "enterprise": {
        "tier": "enterprise",
        "name": "Enterprise / Custom",
        "price_inr": 3999,
        "price_usd": 49.99,
        "interval": "month",
        "description": "Custom security, team collaboration workspaces, and managed infrastructure.",
        "features": [
            "Unlimited datasets (10,000+)",
            "250 MB max file size",
            "Unlimited queries & reports",
            "Dedicated PostgreSQL cluster connection",
            "Custom SLA & direct analyst support",
        ],
        "limits": PLAN_LIMITS["enterprise"],
    },
}


class PaymentService:
    def __init__(self):
        self.settings = get_settings()

    def get_catalog(self) -> Dict[str, Any]:
        """Returns public plan definitions and current platform pricing."""
        return {
            "currency_default": "INR",
            "plans": PLANS_CATALOG,
            "providers_configured": {
                "razorpay": bool(self.settings.RAZORPAY_KEY_ID and self.settings.RAZORPAY_KEY_SECRET),
                "stripe": bool(self.settings.STRIPE_SECRET_KEY),
            },
        }

    def create_checkout_session(
        self,
        user: UserModel,
        plan_tier: str,
        provider: str = "razorpay",
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Creates an official checkout session/order.
        If credentials are not yet configured in production, cleanly returns a sandbox order
        with clear transparent instructions rather than fabricating payments.
        """
        plan_tier = plan_tier.lower()
        if plan_tier not in PLANS_CATALOG or plan_tier == "free":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan tier '{plan_tier}'. Please select 'starter', 'pro', or 'enterprise'.",
            )

        plan = PLANS_CATALOG[plan_tier]
        amount_inr = plan["price_inr"]
        order_id = f"order_{provider}_{uuid.uuid4().hex[:12]}"

        # Record intent in transactions table if DB session is provided
        if db:
            tx = TransactionModel(
                user_id=user.id,
                order_id=order_id,
                provider=provider,
                amount=float(amount_inr),
                currency="INR",
                plan_tier=plan_tier,
                status="created",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(tx)
            db.commit()

        # Check provider configuration
        if provider == "razorpay":
            if self.settings.RAZORPAY_KEY_ID and self.settings.RAZORPAY_KEY_SECRET:
                return {
                    "mode": "live",
                    "provider": "razorpay",
                    "order_id": order_id,
                    "key_id": self.settings.RAZORPAY_KEY_ID,
                    "amount": amount_inr * 100,  # Razorpay expects subunits (paise)
                    "currency": "INR",
                    "plan_tier": plan_tier,
                    "user_email": user.email,
                }
            else:
                return {
                    "mode": "sandbox",
                    "provider": "razorpay",
                    "order_id": order_id,
                    "amount": amount_inr * 100,
                    "currency": "INR",
                    "plan_tier": plan_tier,
                    "message": "Payment provider is currently in Sandbox/Evaluation mode. Configure RAZORPAY_KEY_ID in .env for live gateway transactions.",
                    "user_email": user.email,
                }

        elif provider == "stripe":
            if self.settings.STRIPE_SECRET_KEY:
                return {
                    "mode": "live",
                    "provider": "stripe",
                    "session_id": order_id,
                    "amount": int(plan["price_usd"] * 100),
                    "currency": "USD",
                    "plan_tier": plan_tier,
                }
            else:
                return {
                    "mode": "sandbox",
                    "provider": "stripe",
                    "session_id": order_id,
                    "amount": int(plan["price_usd"] * 100),
                    "currency": "USD",
                    "plan_tier": plan_tier,
                    "message": "Stripe is currently in Sandbox mode. Set STRIPE_SECRET_KEY in .env for live gateway transactions.",
                }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported payment provider '{provider}'. Supported: 'razorpay', 'stripe'.",
            )

    def verify_razorpay_signature(self, order_id: str, payment_id: str, signature: str, secret: Optional[str] = None) -> bool:
        """
        Cryptographic verification of Razorpay payment signature using HMAC-SHA256.
        """
        webhook_secret = secret or self.settings.RAZORPAY_KEY_SECRET or self.settings.RAZORPAY_WEBHOOK_SECRET
        if not webhook_secret:
            logger.warning("Razorpay secret not configured; signature verification cannot proceed safely.")
            return False

        message = f"{order_id}|{payment_id}".encode("utf-8")
        expected = hmac.new(webhook_secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    def verify_razorpay_webhook(self, raw_body: bytes, signature: str, secret: Optional[str] = None) -> bool:
        """
        Verifies Razorpay webhook header `x-razorpay-signature` against raw payload.
        """
        webhook_secret = secret or self.settings.RAZORPAY_WEBHOOK_SECRET or self.settings.RAZORPAY_KEY_SECRET
        if not webhook_secret:
            return False

        expected = hmac.new(webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    def upgrade_user_plan(self, user_id: str, plan_tier: str, order_id: str, payment_id: str, db: Session) -> UserModel:
        """
        Applies verified subscription upgrade to user profile and updates transaction log.
        """
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        plan_tier = plan_tier.lower()
        if plan_tier not in PLANS_CATALOG:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan tier.")

        # Update user plan
        user.plan_tier = plan_tier

        # Find and update transaction
        tx = db.query(TransactionModel).filter(TransactionModel.order_id == order_id).first()
        if tx:
            tx.status = "paid"
            tx.payment_id = payment_id
            tx.updated_at = datetime.now(timezone.utc)
        else:
            # Create completed transaction record
            plan = PLANS_CATALOG[plan_tier]
            tx = TransactionModel(
                user_id=user.id,
                order_id=order_id,
                payment_id=payment_id,
                provider="razorpay",
                amount=float(plan["price_inr"]),
                currency="INR",
                plan_tier=plan_tier,
                status="paid",
            )
            db.add(tx)

        db.commit()
        db.refresh(user)
        logger.info(f"User {user.email} successfully upgraded to {plan_tier.upper()} plan.")
        return user


payment_service = PaymentService()
