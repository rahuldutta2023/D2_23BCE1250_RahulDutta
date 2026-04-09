"""
app/core/data_store.py
──────────────────────────────────────────────────────────────────────────────
Central CSV data layer. Replaces PostgreSQL entirely.

All CSVs are loaded into pandas DataFrames on startup and kept in memory.
Writes flush back to the CSV file immediately so data is persisted.

Usage:
    from app.core.data_store import ds

    users_df   = ds.users
    ds.save_users()          # flush after mutation
"""

import os
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


class DataStore:
    def __init__(self):
        self._load_all()

    def _load_all(self):
        self.users                  = self._load("users.csv")
        self.daily_emissions        = self._load("daily_emissions.csv")
        self.electricity            = self._load("electricity_consumption.csv")
        self.water                  = self._load("water_consumption.csv")
        self.fuel                   = self._load("fuel_consumption.csv")
        self.gas                    = self._load("gas_consumption.csv")
        self.emission_factors       = self._load("emission_factors.csv")
        self.recommendations        = self._load("recommendations.csv")
        self.incentives             = self._load("incentives.csv")
        self.carbon_summary         = self._load("carbon_footprint_summary.csv")

        # New feature tables — created fresh if not present
        self.user_goals    = self._load_or_create("user_goals.csv",
            columns=["goal_id","user_id","monthly_budget_kg","created_at","updated_at"])
        self.eco_actions   = self._load_or_create("eco_actions.csv",
            columns=["action_id","title","points","category","description"])
        self.user_actions  = self._load_or_create("user_actions.csv",
            columns=["id","user_id","action_id","completed_at"])

        # Parse date columns
        for col in ["date", "created_at", "calculated_at"]:
            for df in [self.daily_emissions, self.electricity, self.water, self.fuel, self.gas]:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col], errors="coerce")

        # Seed eco_actions if empty
        if self.eco_actions.empty:
            self._seed_eco_actions()

    def _load(self, filename: str) -> pd.DataFrame:
        path = DATA_DIR / filename
        if path.exists():
            return pd.read_csv(path)
        return pd.DataFrame()

    def _load_or_create(self, filename: str, columns: list) -> pd.DataFrame:
        path = DATA_DIR / filename
        if path.exists():
            return pd.read_csv(path)
        df = pd.DataFrame(columns=columns)
        df.to_csv(path, index=False)
        return df

    def _save(self, df: pd.DataFrame, filename: str):
        df.to_csv(DATA_DIR / filename, index=False)

    # ── Save helpers ──────────────────────────────────────────────────────────
    def save_users(self):              self._save(self.users,           "users.csv")
    def save_daily_emissions(self):    self._save(self.daily_emissions,  "daily_emissions.csv")
    def save_electricity(self):        self._save(self.electricity,      "electricity_consumption.csv")
    def save_water(self):              self._save(self.water,            "water_consumption.csv")
    def save_fuel(self):               self._save(self.fuel,             "fuel_consumption.csv")
    def save_gas(self):                self._save(self.gas,              "gas_consumption.csv")
    def save_recommendations(self):    self._save(self.recommendations,  "recommendations.csv")
    def save_incentives(self):         self._save(self.incentives,       "incentives.csv")
    def save_carbon_summary(self):     self._save(self.carbon_summary,   "carbon_footprint_summary.csv")
    def save_user_goals(self):         self._save(self.user_goals,       "user_goals.csv")
    def save_eco_actions(self):        self._save(self.eco_actions,      "eco_actions.csv")
    def save_user_actions(self):       self._save(self.user_actions,     "user_actions.csv")

    def reload(self):
        """Reload all CSVs from disk (useful after external changes)."""
        self._load_all()

    # ── ID generators ─────────────────────────────────────────────────────────
    def next_id(self, df: pd.DataFrame, id_col: str) -> int:
        if df.empty or id_col not in df.columns:
            return 1
        return int(df[id_col].max()) + 1

    # ── Eco-actions seed ──────────────────────────────────────────────────────
    def _seed_eco_actions(self):
        actions = [
            (1,  "Switched to LED bulbs",              50,  "Energy",    "Replace incandescent bulbs with LEDs to cut lighting energy use by 75%."),
            (2,  "Installed a low-flow showerhead",   100,  "Water",     "Reduces water use by 30-50% per shower without affecting pressure."),
            (3,  "Started composting",                150,  "Waste",     "Composting food scraps reduces landfill methane emissions significantly."),
            (4,  "Installed solar water heater",      200,  "Energy",    "Solar water heating can offset 60-80% of water heating energy needs."),
            (5,  "Switched to public transport",      120,  "Transport", "Regular public transport use reduces per-person CO2 by up to 2.5 tonnes/year."),
            (6,  "Planted a tree",                    100,  "Nature",    "Each tree absorbs ~22 kg CO2 per year over its lifetime."),
            (7,  "Reduced meat consumption (1 week)",  80,  "Food",      "Plant-based meals have 50-70% lower carbon footprint than meat-based ones."),
            (8,  "Fixed all water leaks at home",      60,  "Water",     "A dripping tap wastes ~3,000 litres per year."),
            (9,  "Carpooled for a month",               90,  "Transport", "Sharing a car ride halves per-person fuel consumption and emissions."),
            (10, "Switched to e-billing",               30,  "Digital",   "Paperless billing saves trees and eliminates postal transport emissions."),
        ]
        self.eco_actions = pd.DataFrame(actions,
            columns=["action_id","title","points","category","description"])
        self.save_eco_actions()


# Singleton — import this everywhere
ds = DataStore()
