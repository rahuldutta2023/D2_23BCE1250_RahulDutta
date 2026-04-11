import pandas as pd
from app.core.data_store import ds


def _bucket(size: int) -> str:
    if size <= 2: return "1-2"
    if size <= 4: return "3-4"
    return "5+"


def get_social_proof(user: dict, period: str) -> dict | None:
    year  = int(period[:4])
    month = int(period[5:7])
    city  = str(user.get("city", ""))
    hsize = int(user.get("household_size", 1))
    uid   = int(user["user_id"])
    bucket = _bucket(hsize)

    # Find peer user_ids (same city + same bucket)
    peers = ds.users[ds.users["city"] == city].copy()
    peers["household_size"] = pd.to_numeric(peers["household_size"], errors="coerce").fillna(1).astype(int)
    peers = peers[peers["household_size"].apply(_bucket) == bucket]
    peer_ids = peers["user_id"].tolist()

    if not peer_ids:
        return None

    df = ds.daily_emissions.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df[
        (df["user_id"].isin(peer_ids)) &
        (df["date"].dt.year == year) &
        (df["date"].dt.month == month)
    ]
    monthly = df.groupby("user_id")["co2_emission"].sum().reset_index()
    if monthly.empty:
        return None

    values     = monthly["co2_emission"].tolist()
    peer_avg   = round(sum(values) / len(values), 2)
    peer_min   = round(min(values), 2)
    peer_max   = round(max(values), 2)
    peer_count = len(values)

    user_co2_series = monthly[monthly["user_id"] == uid]["co2_emission"]
    user_co2 = round(float(user_co2_series.iloc[0]) if not user_co2_series.empty else 0.0, 2)

    users_above = sum(1 for v in values if v > user_co2)
    percentile  = round((users_above / max(peer_count, 1)) * 100)
    vs_avg      = round(user_co2 - peer_avg, 2)
    better      = vs_avg <= 0

    message = (
        f"You use {abs(vs_avg):.1f} kg CO2 LESS than similar households in {city}! 🌱"
        if better else
        f"You use {vs_avg:.1f} kg CO2 MORE than similar households in {city}."
    )

    return {
        "city":             city,
        "household_bucket": bucket,
        "peer_count":       peer_count,
        "peer_avg_co2":     peer_avg,
        "peer_min_co2":     peer_min,
        "peer_max_co2":     peer_max,
        "user_percentile":  percentile,
        "vs_avg_kg":        vs_avg,
        "message":          message,
    }
