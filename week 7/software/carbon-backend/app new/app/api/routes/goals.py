from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.core.security import get_current_user
from app.services.goal_service import upsert_goal, get_goal_status

router = APIRouter()


class GoalIn(BaseModel):
    monthly_budget_kg: float = Field(gt=0)


@router.post("/", status_code=201)
def set_goal(payload: GoalIn, current_user: dict = Depends(get_current_user)):
    return upsert_goal(int(current_user["user_id"]), payload.monthly_budget_kg)


@router.get("/")
def get_goal(current_user: dict = Depends(get_current_user)):
    from app.core.data_store import ds
    row = ds.user_goals[ds.user_goals["user_id"] == int(current_user["user_id"])]
    if row.empty:
        raise HTTPException(status_code=404, detail="No goal set. POST /api/goals/ to create one.")
    return row.iloc[0].to_dict()


@router.get("/status")
def goal_status(current_user: dict = Depends(get_current_user)):
    status = get_goal_status(int(current_user["user_id"]))
    if not status:
        raise HTTPException(status_code=404, detail="No goal set. POST /api/goals/ to create one.")
    return status
