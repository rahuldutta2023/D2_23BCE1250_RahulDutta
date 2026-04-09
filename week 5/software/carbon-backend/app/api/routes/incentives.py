from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.security import get_current_user
from app.core.data_store import ds
from app.services.incentive_service import get_leaderboard

router = APIRouter()


@router.get("/me")
def my_incentive(current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    row = ds.incentives[ds.incentives["user_id"] == uid]
    if row.empty:
        raise HTTPException(status_code=404, detail="No incentive record found")
    return row.iloc[0].to_dict()


@router.get("/leaderboard")
def leaderboard(limit: int = Query(default=20, ge=1, le=100),
                city: str = Query(default=None),
                _: dict = Depends(get_current_user)):
    return get_leaderboard(limit=limit, city=city)
