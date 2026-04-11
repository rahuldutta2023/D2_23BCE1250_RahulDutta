from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.services.weather_service import get_weather_for_city

router = APIRouter()


@router.get("/")
def my_weather(current_user: dict = Depends(get_current_user)):
    city = str(current_user.get("city", ""))
    if not city:
        raise HTTPException(status_code=400, detail="No city on profile. Update via PATCH /api/users/me")
    return get_weather_for_city(city)


@router.get("/{city}")
def city_weather(city: str, _: dict = Depends(get_current_user)):
    return get_weather_for_city(city)
