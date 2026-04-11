"""api/routes/predictions.py — Predictive analytics endpoints."""
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.services.prediction_service import predict_next_month

router = APIRouter()


@router.get("/")
def get_predictions(current_user: dict = Depends(get_current_user)):
    """Return linear-regression prediction for next month's CO₂."""
    return predict_next_month(int(current_user["user_id"]))
