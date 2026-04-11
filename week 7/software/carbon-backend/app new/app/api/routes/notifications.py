"""api/routes/notifications.py — In-app notification endpoints."""
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.services.notification_service import get_user_notifications, get_unread_count, mark_read

router = APIRouter()


@router.get("/")
def list_notifications(
    unread_only: bool = Query(default=False),
    current_user: dict = Depends(get_current_user),
):
    return get_user_notifications(int(current_user["user_id"]), unread_only=unread_only)


@router.get("/unread-count")
def unread_count(current_user: dict = Depends(get_current_user)):
    return {"count": get_unread_count(int(current_user["user_id"]))}


@router.post("/{notification_id}/read")
def read_one(notification_id: int, current_user: dict = Depends(get_current_user)):
    mark_read(int(current_user["user_id"]), notification_id)
    return {"status": "ok"}


@router.post("/read-all")
def read_all(current_user: dict = Depends(get_current_user)):
    mark_read(int(current_user["user_id"]))
    return {"status": "ok"}
