"""
services/emission_service.py
CSV-based emission calculations, KPI analysis, monthly summary.
"""
import pandas as pd
from datetime import datetime, date
from app.core.data_store import ds
from app.core.config import settings

FACTORS = settings.EMISSION_FACTORS


# ── CO2 calculators ───────────────────────────────────────────────────────────

def calc_co2(quantity: float, resource: str) -> float:
    return round(quantity * FACTORS.get(resource.lower(), 0), 4)


# ── Log a daily emission row ──────────────────────────────────────────────────

def record_emission(user_id: int, record_date, resource_type: str,
                    quantity: float, co2: float):
    eid = ds.next_id(ds.daily_emissions, "emission_id")
    row = {
        "emission_id":   eid,
        "user_id":       user_id,
        "date":          str(record_date),
        "resource_type": resource_type,
        "quantity":      quantity,
        "co2_emission":  co2,
        "calculated_at": datetime.now().isoformat(),
    }
    ds.daily_emissions = pd.concat(
        [ds.daily_emissions, pd.DataFrame([row])], ignore_index=True
    )
    ds.daily_emissions["date"] = pd.to_datetime(ds.daily_emissions["date"], errors="coerce")
    ds.save_daily_emissions()


# ── Monthly summary ───────────────────────────────────────────────────────────

def compute_monthly_summary(user_id: int, period: str) -> dict:
    """period = 'YYYY-MM'"""
    year, month = int(period[:4]), int(period[5:7])

    df = ds.daily_emissions.copy()

    df = df[
        (df["user_id"] == user_id) &
        (df["date"].dt.year == year) &
        (df["date"].dt.month == month)
    ]

    # 🔥 INTERNAL AGGREGATION FIX
    elec = round(
        float(df[df["resource_type"] == "Electricity"]["co2_emission"].sum()), 4
    )

    water = round(
        float(df[df["resource_type"] == "Water"]["co2_emission"].sum()), 4
    )

    # Petrol + Diesel = Fuel
    fuel = round(
        float(
            df[df["resource_type"].isin(["Petrol", "Diesel"])]
            ["co2_emission"].sum()
        ), 4
    )

    # LPG = Gas
    gas = round(
        float(
            df[df["resource_type"] == "LPG"]
            ["co2_emission"].sum()
        ), 4
    )

    total = round(elec + water + fuel + gas, 4)

    # Upsert in carbon_summary
    mask = (ds.carbon_summary["user_id"] == user_id) & (ds.carbon_summary["period"] == period)
    summary = {
        "user_id":         user_id,
        "period":          period,
        "total_co2":       total,
        "electricity_co2": elec,
        "gas_co2":         gas,
        "fuel_co2":        fuel,
        "water_co2":       water,
    }

    if mask.any():
        for k, v in summary.items():
            ds.carbon_summary.loc[mask, k] = v
    else:
        sid = ds.next_id(ds.carbon_summary, "summary_id")
        summary["summary_id"] = sid
        summary["created_at"] = datetime.now().isoformat()
        ds.carbon_summary = pd.concat(
            [ds.carbon_summary, pd.DataFrame([summary])], ignore_index=True
        )

    ds.save_carbon_summary()
    return summary


# ── KPI analysis ─────────────────────────────────────────────────────────────

def compute_kpis(user_id: int, period: str, household_size: int) -> list:
    year, month = int(period[:4]), int(period[5:7])
    bl = settings.KPI_BASELINES

    def _total_consumption(df_name, val_col):
        df = getattr(ds, df_name)
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        filtered = df[
            (df["user_id"] == user_id) &
            (df["date"].dt.year == year) &
            (df["date"].dt.month == month)
        ]
        return float(filtered[val_col].sum()) if val_col in filtered.columns else 0.0

    data = {
        "Electricity": {
            "actual":   _total_consumption("electricity", "units_kwh"),
            "baseline": bl["electricity_kwh"] * household_size,
            "co2_fn":   lambda x: calc_co2(x, "electricity"),
        },
        "Water": {
            "actual":   _total_consumption("water", "liters_used"),
            "baseline": bl["water_liters"] * household_size,
            "co2_fn":   lambda x: calc_co2(x, "water"),
        },
        "Fuel": {
            "actual":   _total_consumption("fuel", "quantity_liters"),
            "baseline": bl["fuel_liters"] * household_size,
            "co2_fn":   lambda x: calc_co2(x, "petrol"),
        },
        "Gas": {
            "actual":   _total_consumption("gas", "quantity_kg"),
            "baseline": bl["gas_kg"] * household_size,
            "co2_fn":   lambda x: calc_co2(x, "lpg"),
        },
    }

    kpis = []
    for category, d in data.items():
        actual   = round(d["actual"], 2)
        baseline = d["baseline"]
        excess   = max(0.0, round(actual - baseline, 2))
        pct      = round((excess / baseline) * 100, 1) if baseline else 0.0
        co2      = d["co2_fn"](actual)
        status   = "ok" if pct == 0 else ("warning" if pct <= 30 else "critical")
        kpis.append({
            "category":   category,
            "actual":     actual,
            "baseline":   baseline,
            "excess":     excess,
            "excess_pct": pct,
            "co2_kg":     co2,
            "status":     status,
        })
    return kpis