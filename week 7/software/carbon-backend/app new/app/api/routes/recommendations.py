"""api/routes/recommendations.py"""
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.core.data_store import ds
from app.services.emission_service import compute_monthly_summary, compute_kpis
from app.services.recommendation_service import generate_ai_recommendations
from datetime import date

router = APIRouter()


@router.get("/")
def list_recommendations(current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    recs = ds.recommendations[ds.recommendations["user_id"] == uid]
    return recs.to_dict(orient="records")


@router.get("/ai")
def ai_recommendations(current_user: dict = Depends(get_current_user)):
    """Return AI-enhanced or enhanced-rule recommendations for current KPIs."""
    uid    = int(current_user["user_id"])
    hsize  = int(current_user.get("household_size", 1))
    period = date.today().strftime("%Y-%m")
    compute_monthly_summary(uid, period)
    kpis = compute_kpis(uid, period, hsize)
    return generate_ai_recommendations(uid, kpis, current_user)
