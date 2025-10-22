from __future__ import annotations
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr

Role = Literal["admin", "user"]

class LoginRequest(BaseModel):
    identifier: str
    password: str

class UserOut(BaseModel):
    id: int
    # ton admin historique est "admin@local" -> pas un email valide.
    # Pour éviter un 500 sur /auth/login, on met str ici.
    # (Si tu migres ton seed en admin@local.test, tu pourras remettre EmailStr)
    email: str
    username: str
    fullName: Optional[str] = None
    role: Role
    joinedAt: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class UserCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    fullName: Optional[str] = None
    password: str
    role: Optional[Role] = "user"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    fullName: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Role] = None
