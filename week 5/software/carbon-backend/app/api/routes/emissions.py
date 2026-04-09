from fastapi import APIRouter, Depends
from typing import Optional
from datetime import date
import pandas as pd
from app.core.security import get_current_user
from app.core.data_store import ds
from app.services.emission_service import compute_monthly_summary

router = APIRouter()


@router.get("/daily")
def get_daily(start: Optional[date] = None, end: Optional[date] = None,
              current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    df  = ds.daily_emissions[ds.daily_emissions["user_id"] == uid].copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    if start: df = df[df["date"] >= pd.Timestamp(start)]
    if end:   df = df[df["date"] <= pd.Timestamp(end)]
    return df.sort_values("date", ascending=False).to_dict(orient="records")


@router.get("/monthly")
def get_monthly(current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    df  = ds.carbon_summary[ds.carbon_summary["user_id"] == uid]
    return df.sort_values("period", ascending=False).to_dict(orient="records")


@router.post("/monthly/{period}/refresh")
def refresh_summary(period: str, current_user: dict = Depends(get_current_user)):
    return compute_monthly_summary(int(current_user["user_id"]), period)
