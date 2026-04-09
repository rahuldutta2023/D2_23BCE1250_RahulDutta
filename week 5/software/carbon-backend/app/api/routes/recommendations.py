from fastapi import APIRouter, Depends
from datetime import date
from app.core.security import get_current_user
from app.core.data_store import ds
from app.services.emission_service import compute_kpis
from app.services.recommendation_service import generate_recommendations

router = APIRouter()


@router.get("/")
def get_recommendations(current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    df  = ds.recommendations[ds.recommendations["user_id"] == uid]
    return df.sort_values("generated_at", ascending=False).to_dict(orient="records")


@router.post("/refresh")
def refresh_recommendations(current_user: dict = Depends(get_current_user)):
    uid   = int(current_user["user_id"])
    hsize = int(current_user.get("household_size", 1))
    kpis  = compute_kpis(uid, date.today().strftime("%Y-%m"), hsize)
    return generate_recommendations(uid, kpis)
