"""api/routes/admin.py — Admin-only system analytics endpoints."""
from fastapi import APIRouter, Depends, HTTPException
import pandas as pd
from app.core.security import get_current_user
from app.core.data_store import ds

router = APIRouter()


def require_admin(current_user: dict = Depends(get_current_user)):
    if str(current_user.get("role", "")).lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats")
def system_stats(admin: dict = Depends(require_admin)):
    total_users = len(ds.users)
    total_co2 = float(ds.daily_emissions["co2_emission"].sum()) if not ds.daily_emissions.empty and "co2_emission" in ds.daily_emissions.columns else 0.0
    avg_per_user = round(total_co2 / max(total_users, 1), 2)

    # Monthly trend across all users
    if not ds.carbon_summary.empty:
        monthly = (
            ds.carbon_summary.groupby("period")["total_co2"]
            .sum()
            .reset_index()
            .sort_values("period")
            .tail(12)
            .to_dict(orient="records")
        )
    else:
        monthly = []

    # Top emitters
    if not ds.carbon_summary.empty:
        top = (
            ds.carbon_summary.groupby("user_id")["total_co2"]
            .sum()
            .reset_index()
            .sort_values("total_co2", ascending=False)
            .head(10)
        )
        top_users = []
        for _, row in top.iterrows():
            urow = ds.users[ds.users["user_id"] == row["user_id"]]
            name = urow.iloc[0]["full_name"] if not urow.empty else "Unknown"
            city = urow.iloc[0].get("city", "") if not urow.empty else ""
            top_users.append({
                "user_id": int(row["user_id"]),
                "name": name,
                "city": city,
                "total_co2": round(float(row["total_co2"]), 2),
            })
    else:
        top_users = []

    # Resource breakdown across all users
    if not ds.daily_emissions.empty:
        breakdown = (
            ds.daily_emissions.groupby("resource_type")["co2_emission"]
            .sum()
            .reset_index()
            .rename(columns={"co2_emission": "total_co2"})
            .to_dict(orient="records")
        )
    else:
        breakdown = []

    return {
        "total_users": total_users,
        "total_co2_kg": round(total_co2, 2),
        "avg_co2_per_user_kg": avg_per_user,
        "top_emitters": top_users,
        "monthly_system_trend": monthly,
        "resource_breakdown": breakdown,
    }


@router.get("/users")
def all_users(admin: dict = Depends(require_admin)):
    df = ds.users.copy().drop(columns=["password_hash"], errors="ignore")
    # Merge eco_points
    if not ds.incentives.empty:
        inc = ds.incentives[["user_id", "eco_points", "rank"]].copy()
        df = df.merge(inc, on="user_id", how="left")
    return df.to_dict(orient="records")


@router.post("/make-admin/{user_id}")
def make_admin(user_id: int, admin: dict = Depends(require_admin)):
    mask = ds.users["user_id"] == user_id
    if not mask.any():
        raise HTTPException(status_code=404, detail="User not found")
    ds.users.loc[mask, "role"] = "admin"
    ds.save_users()
    return {"status": "ok", "message": f"User {user_id} is now admin"}


@router.post("/reset-user-data/{user_id}")
def reset_user(user_id: int, admin: dict = Depends(require_admin)):
    """Remove all emission data for a user (keep account)."""
    for attr in ["daily_emissions", "electricity", "water", "fuel", "gas", "carbon_summary"]:
        df = getattr(ds, attr)
        if not df.empty and "user_id" in df.columns:
            setattr(ds, attr, df[df["user_id"] != user_id])
    ds.save_daily_emissions()
    ds.save_electricity()
    ds.save_water()
    ds.save_fuel()
    ds.save_gas()
    ds.save_carbon_summary()
    return {"status": "ok", "message": f"Emission data cleared for user {user_id}"}
