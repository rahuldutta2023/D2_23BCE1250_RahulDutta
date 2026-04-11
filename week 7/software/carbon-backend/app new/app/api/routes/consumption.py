"""
Consumption logging — electricity, water, fuel, gas.
Writes to the appropriate CSV and auto-creates a daily_emissions row.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
import pandas as pd

from app.core.security import get_current_user
from app.core.data_store import ds
from app.services.emission_service import calc_co2, record_emission

router = APIRouter()


# ── Electricity ───────────────────────────────────────────────────────────────

class ElectricityIn(BaseModel):
    date:          date
    units_kwh:     float = Field(gt=0)
    meter_reading: Optional[float] = None
    source:        str = "Grid"

@router.post("/electricity", status_code=201)
def add_electricity(payload: ElectricityIn, current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    eid = ds.next_id(ds.electricity, "electricity_id")
    row = {"electricity_id": eid, "user_id": uid, "date": str(payload.date),
           "units_kwh": payload.units_kwh, "meter_reading": payload.meter_reading,
           "source": payload.source, "created_at": datetime.now().isoformat()}
    ds.electricity = pd.concat([ds.electricity, pd.DataFrame([row])], ignore_index=True)
    ds.save_electricity()
    co2 = calc_co2(payload.units_kwh, "electricity")
    record_emission(uid, payload.date, "Electricity", payload.units_kwh, co2)
    return {**row, "co2_kg": co2}

@router.get("/electricity")
def list_electricity(start: Optional[date] = None, end: Optional[date] = None,
                     current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    df  = ds.electricity[ds.electricity["user_id"] == uid].copy()
    df["date"] = pd.to_datetime(df["date"])
    if start: df = df[df["date"] >= pd.Timestamp(start)]
    if end:   df = df[df["date"] <= pd.Timestamp(end)]
    return df.sort_values("date", ascending=False).to_dict(orient="records")


# ── Water ─────────────────────────────────────────────────────────────────────

class WaterIn(BaseModel):
    date:        date
    liters_used: float = Field(gt=0)
    source:      str = "Municipal"

@router.post("/water", status_code=201)
def add_water(payload: WaterIn, current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    wid = ds.next_id(ds.water, "water_id")
    row = {"water_id": wid, "user_id": uid, "date": str(payload.date),
           "liters_used": payload.liters_used, "source": payload.source,
           "created_at": datetime.now().isoformat()}
    ds.water = pd.concat([ds.water, pd.DataFrame([row])], ignore_index=True)
    ds.save_water()
    co2 = calc_co2(payload.liters_used, "water")
    record_emission(uid, payload.date, "Water", payload.liters_used, co2)
    return {**row, "co2_kg": co2}

@router.get("/water")
def list_water(start: Optional[date] = None, end: Optional[date] = None,
               current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    df  = ds.water[ds.water["user_id"] == uid].copy()
    df["date"] = pd.to_datetime(df["date"])
    if start: df = df[df["date"] >= pd.Timestamp(start)]
    if end:   df = df[df["date"] <= pd.Timestamp(end)]
    return df.sort_values("date", ascending=False).to_dict(orient="records")


# ── Fuel ──────────────────────────────────────────────────────────────────────

class FuelIn(BaseModel):
    date:            date
    fuel_type:       str   # Petrol | Diesel | CNG
    quantity_liters: float = Field(gt=0)
    vehicle_type:    Optional[str] = None

@router.post("/fuel", status_code=201)
def add_fuel(payload: FuelIn, current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    fid = ds.next_id(ds.fuel, "fuel_id")
    row = {"fuel_id": fid, "user_id": uid, "date": str(payload.date),
           "fuel_type": payload.fuel_type, "quantity_liters": payload.quantity_liters,
           "vehicle_type": payload.vehicle_type, "created_at": datetime.now().isoformat()}
    ds.fuel = pd.concat([ds.fuel, pd.DataFrame([row])], ignore_index=True)
    ds.save_fuel()
    co2 = calc_co2(payload.quantity_liters, payload.fuel_type.lower())
    record_emission(uid, payload.date, "Fuel", payload.quantity_liters, co2)
    return {**row, "co2_kg": co2}

@router.get("/fuel")
def list_fuel(start: Optional[date] = None, end: Optional[date] = None,
              current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    df  = ds.fuel[ds.fuel["user_id"] == uid].copy()
    df["date"] = pd.to_datetime(df["date"])
    if start: df = df[df["date"] >= pd.Timestamp(start)]
    if end:   df = df[df["date"] <= pd.Timestamp(end)]
    return df.sort_values("date", ascending=False).to_dict(orient="records")


# ── Gas ───────────────────────────────────────────────────────────────────────

class GasIn(BaseModel):
    date:        date
    gas_type:    str   # LPG | PNG
    quantity_kg: float = Field(gt=0)
    purpose:     str = "Cooking"

@router.post("/gas", status_code=201)
def add_gas(payload: GasIn, current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    gid = ds.next_id(ds.gas, "gas_id")
    row = {"gas_id": gid, "user_id": uid, "date": str(payload.date),
           "gas_type": payload.gas_type, "quantity_kg": payload.quantity_kg,
           "purpose": payload.purpose, "created_at": datetime.now().isoformat()}
    ds.gas = pd.concat([ds.gas, pd.DataFrame([row])], ignore_index=True)
    ds.save_gas()
    co2 = calc_co2(payload.quantity_kg, payload.gas_type.lower())
    record_emission(uid, payload.date, "Gas", payload.quantity_kg, co2)
    return {**row, "co2_kg": co2}

@router.get("/gas")
def list_gas(start: Optional[date] = None, end: Optional[date] = None,
             current_user: dict = Depends(get_current_user)):
    uid = int(current_user["user_id"])
    df  = ds.gas[ds.gas["user_id"] == uid].copy()
    df["date"] = pd.to_datetime(df["date"])
    if start: df = df[df["date"] >= pd.Timestamp(start)]
    if end:   df = df[df["date"] <= pd.Timestamp(end)]
    return df.sort_values("date", ascending=False).to_dict(orient="records")
