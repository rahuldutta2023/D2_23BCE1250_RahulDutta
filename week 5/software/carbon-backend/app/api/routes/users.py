from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.security import get_current_user
from app.core.data_store import ds

router = APIRouter()


class UserUpdate(BaseModel):
    full_name:      Optional[str] = None
    city:           Optional[str] = None
    household_size: Optional[int] = None


@router.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password_hash"}


@router.patch("/me")
def update_profile(payload: UserUpdate, current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    idx = ds.users[ds.users["user_id"] == uid].index
    if idx.empty:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name:
        ds.users.loc[idx, "full_name"] = payload.full_name
    if payload.city:
        ds.users.loc[idx, "city"] = payload.city
    if payload.household_size:
        ds.users.loc[idx, "household_size"] = payload.household_size

    ds.save_users()
    return ds.users[ds.users["user_id"] == uid].iloc[0].to_dict()
