"""
services/notification_service.py
Generate, store, and retrieve user notifications.
"""
import pandas as pd
from datetime import datetime
from app.core.data_store import ds


def create_notification(user_id: int, ntype: str, title: str, message: str, severity: str = "info") -> dict:
    nid = ds.next_id(ds.notifications, "notification_id")
    row = {
        "notification_id": nid,
        "user_id":         user_id,
        "type":            ntype,
        "title":           title,
        "message":         message,
        "severity":        severity,
        "is_read":         False,
        "created_at":      datetime.now().isoformat(),
    }
    ds.notifications = pd.concat([ds.notifications, pd.DataFrame([row])], ignore_index=True)
    ds.save_notifications()
    return row


def generate_dashboard_notifications(user_id: int, kpis: list, goal_status: dict, newly_awarded_badges: list):
    """Called every time the dashboard loads — generates alerts for this session."""

    # Budget notifications
    if goal_status:
        used_pct = (goal_status.get("current_co2_kg", 0) / max(goal_status.get("monthly_budget_kg", 1), 0.01)) * 100
        if used_pct >= 100:
            create_notification(user_id, "budget_exceeded",
                "🚨 Budget Exceeded!",
                f"You've used {used_pct:.0f}% of your monthly carbon budget ({goal_status['current_co2_kg']:.1f} kg / {goal_status['monthly_budget_kg']} kg).",
                severity="critical")
        elif used_pct >= 80:
            create_notification(user_id, "budget_warning",
                "⚠️ Approaching Budget Limit",
                f"You've used {used_pct:.0f}% of your monthly carbon budget. Only {goal_status['remaining_budget_kg']:.1f} kg remaining.",
                severity="warning")

    # KPI critical alerts
    for kpi in kpis:
        if kpi["status"] == "critical":
            create_notification(user_id, "high_usage",
                f"🚨 High {kpi['category']} Usage",
                f"Your {kpi['category'].lower()} usage is {kpi['excess_pct']}% above the recommended baseline. {kpi['co2_kg']:.2f} kg CO₂ emitted.",
                severity="critical")

    # Badge earned notifications
    for badge in newly_awarded_badges:
        create_notification(user_id, "badge_earned",
            f"🏅 Badge Unlocked: {badge['emoji']} {badge['name']}",
            badge["description"],
            severity="success")


def get_user_notifications(user_id: int, unread_only: bool = False) -> list:
    if ds.notifications.empty or "user_id" not in ds.notifications.columns:
        return []
    df = ds.notifications[ds.notifications["user_id"] == user_id].copy()
    if unread_only:
        df = df[df["is_read"] == False]
    df = df.sort_values("created_at", ascending=False).head(50)
    return df.to_dict(orient="records")


def get_unread_count(user_id: int) -> int:
    notifs = get_user_notifications(user_id, unread_only=True)
    return len(notifs)


def mark_read(user_id: int, notification_id: int = None):
    if ds.notifications.empty or "user_id" not in ds.notifications.columns:
        return
    if notification_id:
        mask = (ds.notifications["user_id"] == user_id) & (ds.notifications["notification_id"] == notification_id)
    else:
        mask = ds.notifications["user_id"] == user_id
    ds.notifications.loc[mask, "is_read"] = True
    ds.save_notifications()
