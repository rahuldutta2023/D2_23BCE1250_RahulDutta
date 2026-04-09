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
    # Remove existing recommendations for this user
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
        }
        new_recs.append(row)
        ds.recommendations = pd.concat(
            [ds.recommendations, pd.DataFrame([row])], ignore_index=True
        )

    ds.save_recommendations()
    return new_recs
