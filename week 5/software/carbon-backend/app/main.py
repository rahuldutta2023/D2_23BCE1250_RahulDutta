from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import (
    auth, users, consumption, emissions,
    recommendations, incentives, dashboard,
    goals, actions, weather, reports,
)

app = FastAPI(
    title="Carbon Footprint Tracker API",
    description="CSV-backed API — no database required",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
app.include_router(users.router,           prefix="/api/users",           tags=["Users"])
app.include_router(consumption.router,     prefix="/api/consumption",     tags=["Consumption"])
app.include_router(emissions.router,       prefix="/api/emissions",       tags=["Emissions"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(incentives.router,      prefix="/api/incentives",      tags=["Incentives"])
app.include_router(dashboard.router,       prefix="/api/dashboard",       tags=["Dashboard"])
app.include_router(goals.router,           prefix="/api/goals",           tags=["Goals"])
app.include_router(actions.router,         prefix="/api/actions",         tags=["Actions"])
app.include_router(weather.router,         prefix="/api/weather",         tags=["Weather"])
app.include_router(reports.router,         prefix="/api/reports",         tags=["Reports"])


@app.get("/")
def root():
    return {"message": "CarbonTrack API running — CSV mode", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
