from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Carbon Footprint Tracker"
    DEBUG:    bool = True

    # JWT
    SECRET_KEY:                  str = "change-this-secret-in-production"
    ALGORITHM:                   str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Emission factors (kg CO2 per unit)
    EMISSION_FACTORS: dict = {
        "electricity": 0.82,
        "lpg":         2.98,
        "png":         2.20,
        "petrol":      2.31,
        "diesel":      2.68,
        "cng":         1.96,
        "water":       0.0003,
    }

    # KPI baselines (monthly per person)
    KPI_BASELINES: dict = {
        "electricity_kwh": 60,
        "water_liters":    3000,
        "fuel_liters":     15,
        "gas_kg":          5,
    }

    # OpenWeatherMap (free tier — get key at openweathermap.org)
    OPENWEATHER_API_KEY: str = "your_openweathermap_api_key_here"

    class Config:
        env_file = ".env"


settings = Settings()
