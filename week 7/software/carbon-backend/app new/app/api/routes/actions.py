from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.data_store import ds
from app.services.action_service import get_user_actions, complete_action

router = APIRouter()


class CompleteActionIn(BaseModel):
    action_id: int


@router.get("/")
def list_actions(_: dict = Depends(get_current_user)):
    return ds.eco_actions.to_dict(orient="records")


@router.get("/me")
def my_actions(current_user: dict = Depends(get_current_user)):
    return get_user_actions(int(current_user["user_id"]))


@router.post("/complete", status_code=201)
def mark_complete(payload: CompleteActionIn, current_user: dict = Depends(get_current_user)):
    return complete_action(int(current_user["user_id"]), payload.action_id)
