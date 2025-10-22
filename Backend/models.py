# Backend/models.py
from __future__ import annotations
from sqlalchemy import Column, Integer, String, DateTime, func, UniqueConstraint
from sqlalchemy.orm import validates
from .db import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        UniqueConstraint("username", name="uq_users_username"),
    )

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    username = Column(String(80), nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False, default="user")  # "admin" | "user"
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    @validates("role")
    def validate_role(self, key, value):
        v = (value or "").lower()
        if v not in ("admin", "user"):
            raise ValueError("role must be 'admin' or 'user'")
        return v
