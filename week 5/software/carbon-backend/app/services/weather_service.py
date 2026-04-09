"""weather_service.py"""
import httpx
from fastapi import HTTPException
from app.core.config import settings

CITY_COORDS = {
    "Bengaluru":  (12.9716,  77.5946),
    "Delhi":      (28.6139,  77.2090),
    "Mumbai":     (19.0760,  72.8777),
    "Chennai":    (13.0827,  80.2707),
    "Hyderabad":  (17.3850,  78.4867),
    "Pune":       (18.5204,  73.8567),
    "Kolkata":    (22.5726,  88.3639),
}


def _tip(temp: float, city: str) -> str:
    if temp >= 38:
        return f"It's {temp:.0f}°C in {city}! Set AC to 24°C instead of 18°C — each degree lower adds ~6% to your bill. 🌡️"
    elif temp >= 32:
        return f"At {temp:.0f}°C, run ceiling fans before the AC. Fans use 10x less electricity."
    elif temp >= 22:
        return f"Pleasant {temp:.0f}°C! Air-dry laundry instead of a dryer and open windows instead of AC. 🌬️"
    else:
        return f"Cool {temp:.0f}°C in {city}. Wear an extra layer before switching on any heater. 🧥"


def get_weather_for_city(city: str) -> dict:
    if city not in CITY_COORDS:
        raise HTTPException(status_code=400, detail=f"City '{city}' not supported.")

    lat, lon = CITY_COORDS[city]
    api_key  = getattr(settings, "OPENWEATHER_API_KEY", "")

    if not api_key or "your_" in api_key:
        return {"city": city, "temperature": 30.0, "humidity": 65,
                "description": "partly cloudy", "tip": _tip(30.0, city)}
    try:
        resp = httpx.get(
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={api_key}&units=metric", timeout=5.0)
        resp.raise_for_status()
        d = resp.json()
        temp = round(d["main"]["temp"], 1)
        return {"city": city, "temperature": temp, "humidity": d["main"]["humidity"],
                "description": d["weather"][0]["description"], "tip": _tip(temp, city)}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API error: {str(e)}")
