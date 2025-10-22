from __future__ import annotations
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import UserOut, UserCreate, UserUpdate
from ..auth import require_admin, get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

def to_user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        email=u.email,
        username=u.username,
        fullName=u.full_name,
        role=u.role,            # type: ignore
        joinedAt=u.created_at,  # type: ignore
    )

@router.get("", response_model=List[UserOut])
def list_users(_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    return [to_user_out(u) for u in users]

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if db.query(User).filter(User.email.ilike(payload.email)).first():
        raise HTTPException(status_code=400, detail="Email déjà utilisé.")
    if payload.username and db.query(User).filter(User.username.ilike(payload.username)).first():
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà utilisé.")

    u = User(
        email=payload.email,
        username=(payload.username or payload.email.split("@")[0]),
        full_name=payload.fullName,
        password_hash=get_password_hash(payload.password),
        role=(payload.role or "user"),
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return to_user_out(u)

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, patch: UserUpdate, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    if patch.email and patch.email != u.email:
        if db.query(User).filter(User.email.ilike(patch.email)).first():
            raise HTTPException(status_code=400, detail="Email déjà utilisé.")
        u.email = patch.email

    if patch.username and patch.username != u.username:
        if db.query(User).filter(User.username.ilike(patch.username)).first():
            raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà utilisé.")
        u.username = patch.username

    if patch.fullName is not None:
        u.full_name = patch.fullName

    if patch.role is not None:
        u.role = patch.role

    if patch.password:
        u.password_hash = get_password_hash(patch.password)

    db.add(u)
    db.commit()
    db.refresh(u)
    return to_user_out(u)

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(user_id: int, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    db.delete(u)
    db.commit()
    return {"ok": True}
