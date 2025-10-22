from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import LoginRequest, TokenResponse, UserOut
from ..auth import verify_password, create_access_token, get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    ident = (payload.identifier or "").strip().lower()
    user = (
        db.query(User)
        .filter((User.email.ilike(ident)) | (User.username.ilike(ident)))
        .first()
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants invalides.")

    token = create_access_token(
        {"sub": str(user.id), "role": user.role, "email": user.email, "username": user.username},
        settings.ACCESS_TOKEN_EXPIRE,
    )
    return TokenResponse(
        access_token=token,
        user=UserOut(
            id=user.id,
            email=user.email,          # <-- str accepté
            username=user.username,
            fullName=user.full_name,
            role=user.role,            # type: ignore
            joinedAt=user.created_at,  # type: ignore
        ),
    )

@router.get("/me", response_model=UserOut)
def me(current=Depends(get_current_user)):
    return UserOut(
        id=current.id,
        email=current.email,
        username=current.username,
        fullName=current.full_name,
        role=current.role,            # type: ignore
        joinedAt=current.created_at,  # type: ignore
    )
