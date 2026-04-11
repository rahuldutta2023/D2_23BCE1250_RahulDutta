"""
services/prediction_service.py
Linear regression on monthly CO₂ totals to forecast next month's emissions.
Uses only numpy (already a pandas dependency) — no extra packages needed.
"""
import numpy as np
import pandas as pd
from datetime import datetime
from app.core.data_store import ds


def _next_period(period: str) -> str:
    year, month = int(period[:4]), int(period[5:7])
    return f"{year + 1}-01" if month == 12 else f"{year}-{month + 1:02d}"


def _next_period_from_now() -> str:
    return _next_period(datetime.now().strftime("%Y-%m"))


def predict_next_month(user_id: int) -> dict:
    df = ds.carbon_summary[ds.carbon_summary["user_id"] == user_id].copy()
    df = df.sort_values("period")

    base = {
        "next_period": _next_period_from_now(),
        "history": df[["period", "total_co2"]].to_dict(orient="records") if not df.empty else [],
        "resource_predictions": {},
    }

    if len(df) < 2:
        return {
            **base,
            "predicted_co2": None,
            "trend": "insufficient_data",
            "pct_change": 0,
            "confidence": "low",
            "message": "Log at least 2 months of data to unlock emission predictions.",
            "weekly_avg": None,
        }

    x = np.arange(len(df))
    y = df["total_co2"].astype(float).values

    # Linear regression via least-squares
    coeffs = np.polyfit(x, y, 1)
    slope = float(coeffs[0])
    predicted = max(0.0, round(float(np.polyval(coeffs, len(df))), 2))

    last_val = float(y[-1])
    pct_change = round(((predicted - last_val) / last_val * 100), 1) if last_val else 0.0

    trend = "stable"
    if pct_change > 8:
        trend = "increasing"
    elif pct_change < -8:
        trend = "decreasing"

    confidence = "high" if len(df) >= 5 else ("medium" if len(df) >= 3 else "low")

    if pct_change > 0:
        msg = (f"⚠️ Emissions projected to increase by {abs(pct_change)}% next month. "
               f"Consider reducing high-impact activities.")
    elif pct_change < 0:
        msg = (f"🌱 Great trajectory! Emissions projected to drop by {abs(pct_change)}% "
               f"next month. Keep up the good work!")
    else:
        msg = "Your carbon footprint appears stable for next month."

    # Per-resource predictions
    resource_predictions = {}
    for col in ["electricity_co2", "gas_co2", "fuel_co2", "water_co2"]:
        if col in df.columns:
            ry = df[col].fillna(0).astype(float).values
            if len(ry) >= 2 and ry.sum() > 0:
                rcoeffs = np.polyfit(x, ry, 1)
                rpred = max(0.0, round(float(np.polyval(rcoeffs, len(df))), 2))
                key = col.replace("_co2", "")
                resource_predictions[key] = {
                    "predicted": rpred,
                    "trend": "up" if float(rcoeffs[0]) > 0.1 else ("down" if float(rcoeffs[0]) < -0.1 else "stable"),
                }

    # Weekly average from current month daily emissions
    today = datetime.now()
    de = ds.daily_emissions.copy()
    de["date"] = pd.to_datetime(de["date"], errors="coerce")
    this_month = de[
        (de["user_id"] == user_id) &
        (de["date"].dt.year == today.year) &
        (de["date"].dt.month == today.month)
    ]
    weekly_avg = round(float(this_month["co2_emission"].sum()) / max(today.day / 7, 1), 2) if not this_month.empty else None

    return {
        **base,
        "predicted_co2": predicted,
        "trend": trend,
        "pct_change": pct_change,
        "slope_per_month": round(slope, 4),
        "confidence": confidence,
        "message": msg,
        "weekly_avg": weekly_avg,
        "resource_predictions": resource_predictions,
    }
