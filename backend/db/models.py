from datetime import datetime, timezone
import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from backend.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    plan_tier = Column(String(50), default="free")  # free, starter, pro, enterprise
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    datasets = relationship("DatasetModel", back_populates="owner", cascade="all, delete-orphan")
    usage = relationship("UsageModel", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UsageModel(Base):
    __tablename__ = "user_usage"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    analyses_count = Column(Integer, default=0)
    datasets_count = Column(Integer, default=0)
    reports_count = Column(Integer, default=0)
    period_start = Column(DateTime, default=utc_now)

    user = relationship("UserModel", back_populates="usage")


class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)  # Current active processed/loaded dataset file
    raw_file_path = Column(String(500), nullable=True)  # Immutable original upload file
    selected_sheet = Column(String(100), nullable=True)
    available_sheets_json = Column(Text, nullable=True)
    transformation_log_json = Column(Text, nullable=True)  # JSON array of audit logs
    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)
    profile_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    owner = relationship("UserModel", back_populates="datasets")
    conversations = relationship("ConversationModel", back_populates="dataset", cascade="all, delete-orphan")


class ConversationModel(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), nullable=True, index=True)
    title = Column(String(255), default="New Analysis Session")
    created_at = Column(DateTime, default=utc_now)

    dataset = relationship("DatasetModel", back_populates="conversations")
    messages = relationship("MessageModel", back_populates="conversation", cascade="all, delete-orphan", order_by="MessageModel.created_at")


class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    tool_calls_json = Column(Text, nullable=True)
    tool_results_json = Column(Text, nullable=True)
    chart_spec_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    conversation = relationship("ConversationModel", back_populates="messages")


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    dataset_id = Column(String(36), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    content_text = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(255), unique=True, nullable=False, index=True)
    payment_id = Column(String(255), nullable=True, index=True)
    provider = Column(String(50), nullable=False)  # razorpay, stripe
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    plan_tier = Column(String(50), nullable=False)
    status = Column(String(50), default="created")  # created, paid, failed, refunded
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now)

