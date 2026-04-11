"""
services/badge_service.py
Award and retrieve achievement badges based on user activity milestones.
"""
import pandas as pd
from datetime import datetime
from app.core.data_store import ds

BADGE_DEFINITIONS = [
    {"badge_id": 1,  "name": "Eco Beginner",    "emoji": "🌱", "description": "Logged your first consumption entry",           "category": "milestone", "color": "#22c55e"},
    {"badge_id": 2,  "name": "Action Hero",      "emoji": "⚡", "description": "Completed 5 eco-friendly actions",             "category": "actions",   "color": "#f59e0b"},
    {"badge_id": 3,  "name": "Green Champion",   "emoji": "🌍", "description": "All KPIs within budget for a month",          "category": "goal",      "color": "#10b981"},
    {"badge_id": 4,  "name": "Carbon Cutter",    "emoji": "✂️", "description": "Reduced total emissions month-over-month",    "category": "reduction", "color": "#6366f1"},
    {"badge_id": 5,  "name": "Eco Elite",        "emoji": "🏆", "description": "Earned 500+ eco-points",                      "category": "points",    "color": "#eab308"},
    {"badge_id": 6,  "name": "Community Star",   "emoji": "⭐", "description": "Ranked top 25 in your city leaderboard",     "category": "social",    "color": "#f97316"},
    {"badge_id": 7,  "name": "Data Logger",      "emoji": "📊", "description": "Logged data for 3+ consecutive months",      "category": "streak",    "color": "#0ea5e9"},
    {"badge_id": 8,  "name": "Water Saver",      "emoji": "💧", "description": "Water emissions within baseline",             "category": "resource",  "color": "#3b82f6"},
    {"badge_id": 9,  "name": "Energy Guardian",  "emoji": "🔋", "description": "Electricity emissions within baseline",       "category": "resource",  "color": "#a855f7"},
    {"badge_id": 10, "name": "Report Reader",    "emoji": "📄", "description": "Downloaded your first monthly PDF report",   "category": "milestone", "color": "#ec4899"},
]


def _get_earned_ids(user_id: int) -> list:
    if ds.user_badges.empty or "user_id" not in ds.user_badges.columns:
        return []
    return ds.user_badges[ds.user_badges["user_id"] == user_id]["badge_id"].tolist()


def _award(user_id: int, badge_id: int, earned_ids: list, newly_awarded: list):
    if badge_id in earned_ids:
        return
    bid = ds.next_id(ds.user_badges, "id")
    row = {"id": bid, "user_id": user_id, "badge_id": badge_id, "awarded_at": datetime.now().isoformat()}
    ds.user_badges = pd.concat([ds.user_badges, pd.DataFrame([row])], ignore_index=True)
    ds.save_user_badges()
    badge = next((b for b in BADGE_DEFINITIONS if b["badge_id"] == badge_id), None)
    if badge:
        newly_awarded.append(badge)
    earned_ids.append(badge_id)


def check_and_award_badges(user_id: int, kpis: list, incentive: dict) -> list:
    earned_ids = _get_earned_ids(user_id)
    newly_awarded = []

    def give(bid):
        _award(user_id, bid, earned_ids, newly_awarded)

    # 1 — Eco Beginner: any emission logged
    if not ds.daily_emissions[ds.daily_emissions["user_id"] == user_id].empty:
        give(1)

    # 2 — Action Hero: 5+ completed actions
    if not ds.user_actions.empty and "user_id" in ds.user_actions.columns:
        if len(ds.user_actions[ds.user_actions["user_id"] == user_id]) >= 5:
            give(2)

    # 3 — Green Champion: all KPIs "ok"
    if kpis and all(k["status"] == "ok" for k in kpis):
        give(3)

    # 4 — Carbon Cutter: month-over-month reduction
    summary = ds.carbon_summary[ds.carbon_summary["user_id"] == user_id].sort_values("period")
    if len(summary) >= 2:
        vals = summary["total_co2"].astype(float).values
        if vals[-1] < vals[-2]:
            give(4)

    # 5 — Eco Elite: 500+ points
    if incentive and float(incentive.get("eco_points", 0)) >= 500:
        give(5)

    # 6 — Community Star: rank <= 25
    if incentive and incentive.get("rank") and float(str(incentive["rank"]).replace("nan", "0") or 0) > 0:
        try:
            if int(float(incentive["rank"])) <= 25:
                give(6)
        except (ValueError, TypeError):
            pass

    # 7 — Data Logger: 3+ months of data
    if len(summary) >= 3:
        give(7)

    # 8 — Water Saver
    water_kpi = next((k for k in kpis if k["category"] == "Water"), None)
    if water_kpi and water_kpi["status"] == "ok":
        give(8)

    # 9 — Energy Guardian
    elec_kpi = next((k for k in kpis if k["category"] == "Electricity"), None)
    if elec_kpi and elec_kpi["status"] == "ok":
        give(9)

    return newly_awarded


def get_user_badges(user_id: int) -> list:
    earned_ids = _get_earned_ids(user_id)
    earned_at_map = {}
    if not ds.user_badges.empty and "user_id" in ds.user_badges.columns:
        for _, row in ds.user_badges[ds.user_badges["user_id"] == user_id].iterrows():
            earned_at_map[int(row["badge_id"])] = row.get("awarded_at", "")

    return [
        {
            **b,
            "earned": b["badge_id"] in earned_ids,
            "awarded_at": earned_at_map.get(b["badge_id"], None),
        }
        for b in BADGE_DEFINITIONS
    ]


def award_report_badge(user_id: int):
    earned_ids = _get_earned_ids(user_id)
    newly_awarded = []
    _award(user_id, 10, earned_ids, newly_awarded)
    return newly_awarded
