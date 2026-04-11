from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.core.data_store import ds
from app.core.security import hash_password, create_access_token

router = APIRouter()


class UserRegister(BaseModel):
    full_name:      str
    email:          EmailStr
    password:       str = Field(min_length=6)
    city:           Optional[str] = None
    household_size: int = Field(default=1, ge=1, le=20)


class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    full_name:    str


@router.post("/register", status_code=201)
async def register(payload: UserRegister):
    if not ds.users[ds.users["email"] == payload.email].empty:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = ds.next_id(ds.users, "user_id")

    hashed_pw = await run_in_threadpool(hash_password, payload.password)

    new_user = {
        "user_id":        user_id,
        "full_name":      payload.full_name,
        "email":          payload.email,
        "password_hash":  hashed_pw,
        "role":           "household",
        "city":           payload.city or "",
        "household_size": payload.household_size,
        "created_at":     datetime.now().isoformat(),
    }

    import pandas as pd
    ds.users = pd.concat([ds.users, pd.DataFrame([new_user])], ignore_index=True)
    ds.save_users()

    inc_id = ds.next_id(ds.incentives, "incentive_id")
    new_inc = {
        "incentive_id": inc_id,
        "user_id":      user_id,
        "eco_points":   0,
        "rank":         None,
        "last_updated": datetime.now().isoformat(),
    }

    ds.incentives = pd.concat([ds.incentives, pd.DataFrame([new_inc])], ignore_index=True)
    ds.save_incentives()

    return {"message": "Registered successfully", "user_id": user_id}


# ==========================
# 🚨 DEMO LOGIN MODE ENABLED
# ==========================
@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    
    # Login using ONLY EMAIL for demo
    row = ds.users[ds.users["email"] == form.username]

    if row.empty:
        raise HTTPException(status_code=404, detail="User not found")

    user = row.iloc[0].to_dict()

    # 🚨 Skipping password verification for demo video
    token = create_access_token({"sub": str(user["user_id"])})

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user_id":      int(user["user_id"]),
        "full_name":    user["full_name"],
    }