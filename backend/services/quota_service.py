from datetime import datetime, timezone
from typing import Dict, Optional
from fastapi import HTTPException, status
from backend.db.models import UsageModel, UserModel

PLAN_LIMITS: Dict[str, Dict[str, int]] = {
    "free": {
        "max_datasets": 5,
        "max_file_size_mb": 10,
        "max_queries_month": 25,
        "max_reports_month": 5,
    },
    "starter": {
        "max_datasets": 25,
        "max_file_size_mb": 25,
        "max_queries_month": 250,
        "max_reports_month": 50,
    },
    "pro": {
        "max_datasets": 100,
        "max_file_size_mb": 50,
        "max_queries_month": 1000,
        "max_reports_month": 250,
    },
    "enterprise": {
        "max_datasets": 10000,
        "max_file_size_mb": 250,
        "max_queries_month": 100000,
        "max_reports_month": 100000,
    },
}


class QuotaService:
    def get_user_limits(self, user: Optional[UserModel]) -> Dict[str, int]:
        tier = (user.plan_tier if user else "free").lower()
        return PLAN_LIMITS.get(tier, PLAN_LIMITS["free"])

    def get_or_create_usage(self, user: UserModel, db) -> UsageModel:
        usage = db.query(UsageModel).filter(UsageModel.user_id == user.id).first()
        if not usage:
            usage = UsageModel(
                user_id=user.id,
                analyses_count=0,
                datasets_count=0,
                reports_count=0,
            )
            db.add(usage)
            db.commit()
            db.refresh(usage)
        return usage

    def check_upload_quota(self, user: Optional[UserModel], file_size_bytes: int, current_datasets_count: int) -> None:
        limits = self.get_user_limits(user)
        max_bytes = limits["max_file_size_mb"] * 1024 * 1024

        if file_size_bytes > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Upload exceeds your plan limit of {limits['max_file_size_mb']}MB. Upgrade for larger file processing.",
            )

        if current_datasets_count >= limits["max_datasets"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Dataset limit reached ({limits['max_datasets']} datasets). Please upgrade your subscription to store more datasets.",
            )

    def check_analysis_quota(self, user: Optional[UserModel], usage: Optional[UsageModel]) -> None:
        if not user or not usage:
            return  # Allow demo usage

        limits = self.get_user_limits(user)
        if usage.analyses_count >= limits["max_queries_month"]:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Monthly analysis quota reached ({limits['max_queries_month']} queries). Please upgrade to Starter or Pro plan to continue.",
            )

    def record_analysis(self, user: Optional[UserModel], db) -> None:
        if not user:
            return
        usage = self.get_or_create_usage(user, db)
        usage.analyses_count += 1
        db.commit()

    def record_report(self, user: Optional[UserModel], db) -> None:
        if not user:
            return
        usage = self.get_or_create_usage(user, db)
        usage.reports_count += 1
        db.commit()


quota_service = QuotaService()
