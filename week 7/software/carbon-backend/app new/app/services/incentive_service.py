import pandas as pd
from datetime import datetime
from app.core.data_store import ds

POINTS_PER_PCT_SAVED = 2
MAX_MONTHLY_POINTS   = 500


def award_points(user_id: int, kpis: list) -> int:
    new_points = 0
    for kpi in kpis:
        baseline = kpi["baseline"]
        actual   = kpi["actual"]
        if baseline > 0 and actual < baseline:
            saved_pct  = ((baseline - actual) / baseline) * 100
            pts        = min(int(saved_pct * POINTS_PER_PCT_SAVED), MAX_MONTHLY_POINTS)
            new_points += pts

    mask = ds.incentives["user_id"] == user_id
    if mask.any():
        ds.incentives.loc[mask, "eco_points"] = ds.incentives.loc[mask, "eco_points"].astype(int) + new_points
        ds.incentives.loc[mask, "last_updated"] = datetime.now().isoformat()
    else:
        iid = ds.next_id(ds.incentives, "incentive_id")
        ds.incentives = pd.concat([ds.incentives, pd.DataFrame([{
            "incentive_id": iid, "user_id": user_id,
            "eco_points": new_points, "rank": None,
            "last_updated": datetime.now().isoformat()
        }])], ignore_index=True)

    _refresh_ranks()
    ds.save_incentives()
    return new_points


def _refresh_ranks():
    if ds.incentives.empty:
        return
    ds.incentives = ds.incentives.copy()
    ds.incentives["eco_points"] = pd.to_numeric(ds.incentives["eco_points"], errors="coerce").fillna(0)
    ds.incentives["rank"] = ds.incentives["eco_points"].rank(ascending=False, method="min").astype(int)


def get_leaderboard(limit: int = 20, city: str = None) -> list:
    df = ds.incentives.copy()
    df = df.merge(ds.users[["user_id", "full_name", "city"]], on="user_id", how="left")
    if city:
        df = df[df["city"] == city]
    df = df.sort_values("eco_points", ascending=False).head(limit)
    df["rank"] = range(1, len(df) + 1)
    return df[["rank", "user_id", "full_name", "city", "eco_points"]].to_dict(orient="records")
