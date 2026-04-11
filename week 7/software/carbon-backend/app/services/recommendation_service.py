"""
services/recommendation_service.py
Hybrid recommendation engine: rule-based + optional LLM enhancement via Anthropic API.
"""
import json
import os
import pandas as pd
from datetime import datetime
from app.core.data_store import ds

RULES = {
    "Electricity": {
        "warning":  "Your electricity use is moderately above the household baseline. Try turning off standby appliances and switching to LED bulbs.",
        "critical": "Critical electricity overuse detected. Consider an energy audit, use appliances during off-peak hours, and explore rooftop solar.",
    },
    "Water": {
        "warning":  "Water consumption is above the recommended level. Fix dripping taps and reduce shower durations.",
        "critical": "Critical water overuse. Install low-flow fixtures, harvest rainwater, and recycle greywater for gardening.",
    },
    "Fuel": {
        "warning":  "Fuel use is moderately high. Combine errands into single trips and check tyre pressure for better mileage.",
        "critical": "High fuel consumption detected. Consider carpooling, switching to CNG or EV, and using public transport.",
    },
    "Gas": {
        "warning":  "Gas consumption is above baseline. Use pressure cookers to reduce cooking time and ensure burner caps are clean.",
        "critical": "Critical gas usage. Check for leaks, insulate pipes, and consider an induction cooktop.",
    },
}


def generate_recommendations(user_id: int, kpis: list) -> list:
    ds.recommendations = ds.recommendations[ds.recommendations["user_id"] != user_id]
    new_recs = []
    for kpi in kpis:
        if kpi["status"] == "ok":
            continue
        message = RULES.get(kpi["category"], {}).get(kpi["status"], "Reduce your consumption.")
        rid = ds.next_id(ds.recommendations, "recommendation_id")
        row = {
            "recommendation_id": rid,
            "user_id":           user_id,
            "category":          kpi["category"],
            "message":           message,
            "severity":          kpi["status"].capitalize(),
            "generated_at":      datetime.now().isoformat(),
            "source":            "rule",
        }
        new_recs.append(row)
        ds.recommendations = pd.concat([ds.recommendations, pd.DataFrame([row])], ignore_index=True)
    ds.save_recommendations()
    return new_recs


def generate_ai_recommendations(user_id: int, kpis: list, user_context: dict) -> dict:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    kpi_summary = "\n".join([
        f"- {k['category']}: {k['actual']} units, baseline {k['baseline']}, "
        f"{k['excess_pct']}% above, status: {k['status']}, CO2: {k['co2_kg']} kg"
        for k in kpis
    ])

    if not api_key or api_key in ("", "your_anthropic_api_key_here"):
        return _enhanced_rule_fallback(kpis, user_context)

    try:
        import requests
        prompt = (
            f"You are a sustainability advisor for a household carbon footprint tracker.\n\n"
            f"User: city={user_context.get('city','unknown')}, household_size={user_context.get('household_size',1)}\n\n"
            f"KPIs this month:\n{kpi_summary}\n\n"
            f"Provide 3-4 specific, actionable recommendations as a JSON array only (no markdown):\n"
            f'[{{"category":"...","action":"...","impact":"saves ~X kg CO2/month","priority":"high|medium|low","emoji":"..."}}]'
        )
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json={"model": "claude-haiku-4-5-20251001", "max_tokens": 800, "messages": [{"role": "user", "content": prompt}]},
            timeout=15,
        )
        if resp.status_code == 200:
            content = resp.json()["content"][0]["text"]
            return {"source": "ai", "recommendations": json.loads(content)}
    except Exception:
        pass

    return _enhanced_rule_fallback(kpis, user_context)


def _enhanced_rule_fallback(kpis: list, user_context: dict) -> dict:
    hsize = int(user_context.get("household_size", 1))
    extended = {
        "Electricity": [
            {"action": "Switch all bulbs to LED lighting",                               "impact": f"Saves ~{hsize*3} kg CO₂/month", "emoji": "💡", "priority": "high"},
            {"action": "Unplug devices and chargers when not in use",                    "impact": "Saves ~2 kg CO₂/month",          "emoji": "🔌", "priority": "medium"},
            {"action": "Wash clothes in cold water and air-dry instead of tumble dry",   "impact": "Saves ~1.5 kg CO₂/month",        "emoji": "👕", "priority": "medium"},
        ],
        "Water": [
            {"action": "Install a low-flow showerhead (reduces usage by 40%)",           "impact": "Saves ~0.8 kg CO₂/month", "emoji": "🚿", "priority": "high"},
            {"action": "Fix dripping taps — one drip/second wastes 3,000 L/year",        "impact": "Saves ~0.3 kg CO₂/month", "emoji": "🔧", "priority": "high"},
            {"action": "Collect and reuse cooking water for plants",                     "impact": "Saves ~0.15 kg CO₂/month","emoji": "🌿", "priority": "low"},
        ],
        "Fuel": [
            {"action": "Carpool or use public transport 3 days/week",                    "impact": f"Saves ~{hsize*5} kg CO₂/month", "emoji": "🚌", "priority": "high"},
            {"action": "Maintain correct tyre pressure to improve fuel efficiency by 3%","impact": "Saves ~1 kg CO₂/month",          "emoji": "🚗", "priority": "medium"},
            {"action": "Batch errands into single trips to reduce total kilometres",      "impact": "Saves ~2 kg CO₂/month",          "emoji": "🗺️", "priority": "medium"},
        ],
        "Gas": [
            {"action": "Use a pressure cooker — reduces cooking time by 70%",            "impact": "Saves ~1.5 kg CO₂/month", "emoji": "🍲", "priority": "high"},
            {"action": "Keep burner flames blue (not yellow) for optimal efficiency",     "impact": "Saves ~0.5 kg CO₂/month", "emoji": "🔵", "priority": "medium"},
            {"action": "Cover pots while cooking to retain heat",                        "impact": "Saves ~0.4 kg CO₂/month", "emoji": "♨️", "priority": "low"},
        ],
    }
    recs = []
    for kpi in kpis:
        if kpi["status"] == "ok":
            continue
        tips = extended.get(kpi["category"], [])
        num  = 3 if kpi["status"] == "critical" else 2
        for tip in tips[:num]:
            recs.append({"category": kpi["category"], **tip})
    return {"source": "enhanced_rules", "recommendations": recs}
