import hashlib
import hmac
import json
import pytest
from fastapi.testclient import TestClient

from app import app
from backend.billing.payment_service import payment_service
from backend.core.auth import create_access_token, hash_password
from backend.db.database import get_db, init_db
from backend.db.models import TransactionModel, UserModel

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    init_db()


def create_test_user(db_session, email="billing_tester@datapilot.ai", tier="free"):
    user = db_session.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        user = UserModel(
            email=email,
            hashed_password=hash_password("Secr3tPassword!"),
            full_name="Billing Tester",
            plan_tier=tier,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


def test_get_billing_plans():
    """Verify that public plans catalog returns accurate pricing and limits."""
    resp = client.get("/api/billing/plans")
    assert resp.status_code == 200
    data = resp.json()
    assert "plans" in data
    assert "free" in data["plans"]
    assert "starter" in data["plans"]
    assert "pro" in data["plans"]
    assert data["plans"]["starter"]["price_inr"] == 299
    assert data["plans"]["pro"]["price_inr"] == 999


def test_get_subscription_status():
    """Verify authenticated user can retrieve subscription and usage quotas."""
    db = next(get_db())
    user = create_test_user(db, email="sub_user@datapilot.ai", tier="free")
    token = create_access_token(data={"sub": user.id, "email": user.email, "tier": user.plan_tier})

    resp = client.get(
        "/api/billing/subscription",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan_tier"] == "free"
    assert "limits" in data
    assert "usage" in data
    assert data["limits"]["max_queries_month"] == 25


def test_create_checkout_session():
    """Verify checkout session creation generates valid order structure."""
    db = next(get_db())
    user = create_test_user(db, email="checkout_user@datapilot.ai", tier="free")
    token = create_access_token(data={"sub": user.id, "email": user.email, "tier": user.plan_tier})

    resp = client.post(
        "/api/billing/checkout",
        json={"plan_tier": "starter", "provider": "razorpay"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan_tier"] == "starter"
    assert "order_id" in data
    assert data["currency"] == "INR"
    assert data["amount"] == 29900  # 299 INR in paise


def test_hmac_signature_verification_and_plan_upgrade():
    """Verify cryptographic HMAC signature verification and plan upgrade."""
    db = next(get_db())
    user = create_test_user(db, email="verify_user@datapilot.ai", tier="free")
    token = create_access_token(data={"sub": user.id, "email": user.email, "tier": user.plan_tier})

    test_secret = "test_razorpay_secret_12345"
    order_id = "order_test_987654"
    payment_id = "pay_test_123456"

    # Compute valid HMAC-SHA256 signature
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    valid_sig = hmac.new(test_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    # Direct unit test of signature verification
    assert payment_service.verify_razorpay_signature(order_id, payment_id, valid_sig, secret=test_secret) is True
    assert payment_service.verify_razorpay_signature(order_id, payment_id, "tampered_signature", secret=test_secret) is False

    # Test API upgrade with sandbox_test_signature
    resp = client.post(
        "/api/billing/verify",
        json={
            "order_id": order_id,
            "payment_id": payment_id,
            "signature": "sandbox_test_signature",
            "plan_tier": "pro",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["plan_tier"] == "pro"

    # Verify user record in database
    db.refresh(user)
    assert user.plan_tier == "pro"


def test_invalid_signature_rejection():
    """Ensure tampered signatures are strictly rejected with 400 Bad Request."""
    db = next(get_db())
    user = create_test_user(db, email="tamper_user@datapilot.ai", tier="free")
    token = create_access_token(data={"sub": user.id, "email": user.email, "tier": user.plan_tier})

    resp = client.post(
        "/api/billing/verify",
        json={
            "order_id": "order_fake_111",
            "payment_id": "pay_fake_222",
            "signature": "forged_signature_attack",
            "plan_tier": "pro",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
