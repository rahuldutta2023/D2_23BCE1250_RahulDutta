from fastapi import APIRouter, Depends
from datetime import date
import pandas as pd

from app.core.security import get_current_user
from app.core.data_store import ds
from app.services.emission_service import compute_monthly_summary, compute_kpis
from app.services.recommendation_service import generate_recommendations
from app.services.incentive_service import award_points
from app.services.social_proof_service import get_social_proof
from app.services.nature_service import get_nature_equivalents
from app.services.goal_service import get_goal_status
from app.services.weather_service import get_weather_for_city
from app.services.badge_service import check_and_award_badges, get_user_badges
from app.services.notification_service import generate_dashboard_notifications, get_unread_count
from app.services.prediction_service import predict_next_month

router = APIRouter()


@router.get("/")
def get_dashboard(current_user: dict = Depends(get_current_user)):
    uid    = int(current_user["user_id"])
    hsize  = int(current_user.get("household_size", 1))
    city   = str(current_user.get("city", ""))
    period = date.today().strftime("%Y-%m")

    summary = compute_monthly_summary(uid, period)
    kpis    = compute_kpis(uid, period, hsize)
    recs    = generate_recommendations(uid, kpis)
    award_points(uid, kpis)

    # 12-month trend
    trend = (
        ds.carbon_summary[ds.carbon_summary["user_id"] == uid]
        .sort_values("period", ascending=False)
        .head(12)
        .to_dict(orient="records")
    )

    inc_row   = ds.incentives[ds.incentives["user_id"] == uid]
    incentive = inc_row.iloc[0].to_dict() if not inc_row.empty else None

    social      = get_social_proof(current_user, period)
    peer_avg    = social["peer_avg_co2"] if social else summary["total_co2"]
    nature      = get_nature_equivalents(summary["total_co2"], peer_avg)
    goal_status = get_goal_status(uid)

    # Badges & notifications
    newly_awarded = check_and_award_badges(uid, kpis, incentive or {})
    generate_dashboard_notifications(uid, kpis, goal_status, newly_awarded)
    unread_count  = get_unread_count(uid)
    badges        = get_user_badges(uid)

    # Prediction
    prediction = predict_next_month(uid)

    weather = None
    if city:
        try:
            weather = get_weather_for_city(city)
        except Exception:
            weather = None

    return {
        "user":              {k: v for k, v in current_user.items() if k != "password_hash"},
        "current_period":    period,
        "total_co2":         summary["total_co2"],
        "kpis":              kpis,
        "monthly_trend":     trend,
        "recommendations":   recs,
        "incentive":         incentive,
        "social_proof":      social,
        "nature_equivalents":nature,
        "goal_status":       goal_status,
        "weather":           weather,
        "badges":            badges,
        "newly_awarded":     newly_awarded,
        "unread_notifications": unread_count,
        "prediction":        prediction,
    }
