from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from backend.core.auth import (
    create_access_token,
    get_current_user_optional,
    get_current_user_required,
    hash_password,
    verify_password,
)
from backend.db.database import get_db
from backend.db.models import UsageModel, UserModel
from backend.services.quota_service import PLAN_LIMITS, quota_service

router = APIRouter(prefix="/api/auth", tags=["Authentication & User"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password must be at least 6 characters.")
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpgradePlanRequest(BaseModel):
    plan_tier: str = Field(description="Target tier: 'starter', 'pro', 'enterprise'.")


@router.post("/register")
def register_user(req: RegisterRequest, db=Depends(get_db)):
    """Registers a new user and returns signed JWT token."""
    existing = db.query(UserModel).filter(UserModel.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    user = UserModel(
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password),
        full_name=req.full_name or req.email.split("@")[0],
        plan_tier="free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize usage tracker
    quota_service.get_or_create_usage(user, db)

    token = create_access_token(data={"sub": user.id, "email": user.email, "tier": user.plan_tier})

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "plan_tier": user.plan_tier,
        },
    }


@router.post("/login")
def login_user(req: LoginRequest, db=Depends(get_db)):
    """Authenticates user with email and password."""
    user = db.query(UserModel).filter(UserModel.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user.id, "email": user.email, "tier": user.plan_tier})

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "plan_tier": user.plan_tier,
        },
    }


@router.get("/me")
def get_user_profile(user: UserModel = Depends(get_current_user_required), db=Depends(get_db)):
    """Returns profile and current billing quota consumption."""
    usage = quota_service.get_or_create_usage(user, db)
    limits = quota_service.get_user_limits(user)

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "plan_tier": user.plan_tier,
        "limits": limits,
        "usage": {
            "analyses_count": usage.analyses_count,
            "datasets_count": usage.datasets_count,
            "reports_count": usage.reports_count,
            "analyses_remaining": max(0, limits["max_queries_month"] - usage.analyses_count),
        },
    }


@router.post("/upgrade")
def upgrade_plan(
    req: UpgradePlanRequest,
    user: UserModel = Depends(get_current_user_required),
    db=Depends(get_db),
):
    """Upgrades subscription tier (Billing integration boundary)."""
    tier_lower = req.plan_tier.lower()
    if tier_lower not in PLAN_LIMITS:
        raise HTTPException(status_code=400, detail=f"Invalid plan tier. Choose from: {list(PLAN_LIMITS.keys())}")

    user.plan_tier = tier_lower
    db.commit()

    return {
        "status": "success",
        "message": f"Plan successfully upgraded to {tier_lower.title()}!",
        "new_tier": tier_lower,
        "limits": PLAN_LIMITS[tier_lower],
    }
