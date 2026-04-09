"""action_service.py"""
import pandas as pd
from datetime import datetime
from fastapi import HTTPException
from app.core.data_store import ds


def get_user_actions(user_id: int) -> dict:
    completed_rows = ds.user_actions[ds.user_actions["user_id"] == user_id]
    completed_ids  = set(completed_rows["action_id"].tolist())

    completed = []
    for _, r in completed_rows.iterrows():
        action = ds.eco_actions[ds.eco_actions["action_id"] == r["action_id"]]
        if action.empty: continue
        a = action.iloc[0]
        completed.append({
            "action_id":    int(r["action_id"]),
            "title":        a["title"],
            "points":       int(a["points"]),
            "category":     a["category"],
            "completed_at": str(r["completed_at"]),
        })

    pending = [
        {
            "action_id":   int(row["action_id"]),
            "title":       row["title"],
            "points":      int(row["points"]),
            "category":    row["category"],
            "description": row.get("description", ""),
        }
        for _, row in ds.eco_actions.iterrows()
        if int(row["action_id"]) not in completed_ids
    ]
    return {"completed": completed, "pending": pending}


def complete_action(user_id: int, action_id: int) -> dict:
    action = ds.eco_actions[ds.eco_actions["action_id"] == action_id]
    if action.empty:
        raise HTTPException(status_code=404, detail="Action not found")

    # Duplicate check
    already = ds.user_actions[
        (ds.user_actions["user_id"] == user_id) &
        (ds.user_actions["action_id"] == action_id)
    ]
    if not already.empty:
        raise HTTPException(status_code=409, detail="Action already completed")

    points = int(action.iloc[0]["points"])
    new_id = ds.next_id(ds.user_actions, "id")
    ds.user_actions = pd.concat([ds.user_actions, pd.DataFrame([{
        "id": new_id, "user_id": user_id,
        "action_id": action_id, "completed_at": datetime.now().isoformat()
    }])], ignore_index=True)
    ds.save_user_actions()

    # Award points
    mask = ds.incentives["user_id"] == user_id
    if mask.any():
        ds.incentives.loc[mask, "eco_points"] = pd.to_numeric(
            ds.incentives.loc[mask, "eco_points"], errors="coerce").fillna(0).astype(int) + points
    else:
        iid = ds.next_id(ds.incentives, "incentive_id")
        ds.incentives = pd.concat([ds.incentives, pd.DataFrame([{
            "incentive_id": iid, "user_id": user_id,
            "eco_points": points, "rank": None,
            "last_updated": datetime.now().isoformat()
        }])], ignore_index=True)
    ds.save_incentives()

    total = int(ds.incentives[ds.incentives["user_id"] == user_id].iloc[0]["eco_points"])
    title = action.iloc[0]["title"]
    return {
        "message":       f"✅ '{title}' completed! +{points} eco-points",
        "points_earned": points,
        "total_points":  total,
    }
