"""goal_service.py"""
import calendar
import pandas as pd
from datetime import date, datetime
from app.core.data_store import ds


def upsert_goal(user_id: int, monthly_budget_kg: float) -> dict:
    mask = ds.user_goals["user_id"] == user_id
    now  = datetime.now().isoformat()
    if mask.any():
        ds.user_goals.loc[mask, "monthly_budget_kg"] = monthly_budget_kg
        ds.user_goals.loc[mask, "updated_at"] = now
    else:
        gid = ds.next_id(ds.user_goals, "goal_id")
        row = {"goal_id": gid, "user_id": user_id,
               "monthly_budget_kg": monthly_budget_kg,
               "created_at": now, "updated_at": now}
        ds.user_goals = pd.concat([ds.user_goals, pd.DataFrame([row])], ignore_index=True)
    ds.save_user_goals()
    return ds.user_goals[ds.user_goals["user_id"] == user_id].iloc[0].to_dict()


def get_goal_status(user_id: int) -> dict | None:
    row = ds.user_goals[ds.user_goals["user_id"] == user_id]
    if row.empty:
        return None
    budget = float(row.iloc[0]["monthly_budget_kg"])

    today          = date.today()
    days_in_month  = calendar.monthrange(today.year, today.month)[1]
    days_elapsed   = today.day

    df = ds.daily_emissions.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    current_co2 = float(df[
        (df["user_id"] == user_id) &
        (df["date"].dt.year == today.year) &
        (df["date"].dt.month == today.month)
    ]["co2_emission"].sum())

    projected = round((current_co2 / max(days_elapsed, 1)) * days_in_month, 2)
    remaining = round(budget - current_co2, 2)

    if current_co2 >= budget:           status = "EXCEEDED"
    elif projected >= budget * 0.9:     status = "WARNING"
    else:                               status = "ON_TRACK"

    msgs = {
        "ON_TRACK": f"Great! Projected end-of-month: {projected} kg vs your {budget} kg budget.",
        "WARNING":  f"⚠️ Projected to reach {projected} kg — close to your {budget} kg budget.",
        "EXCEEDED": f"🚨 Already used {round(current_co2,1)} kg of your {budget} kg budget.",
    }
    return {
        "monthly_budget_kg":   budget,
        "current_co2_kg":      round(current_co2, 2),
        "projected_co2_kg":    projected,
        "remaining_budget_kg": remaining,
        "days_elapsed":        days_elapsed,
        "days_remaining":      days_in_month - days_elapsed,
        "days_in_month":       days_in_month,
        "status":              status,
        "alert_message":       msgs[status],
    }
