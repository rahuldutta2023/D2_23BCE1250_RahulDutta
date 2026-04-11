"""api/routes/badges.py — Badge system endpoints."""
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.services.badge_service import get_user_badges, award_report_badge

router = APIRouter()


@router.get("/me")
def my_badges(current_user: dict = Depends(get_current_user)):
    """Return all badges with earned status for the current user."""
    return get_user_badges(int(current_user["user_id"]))


@router.post("/report-downloaded")
def report_badge(current_user: dict = Depends(get_current_user)):
    """Award the Report Reader badge when user downloads a PDF."""
    awarded = award_report_badge(int(current_user["user_id"]))
    return {"awarded": awarded}
