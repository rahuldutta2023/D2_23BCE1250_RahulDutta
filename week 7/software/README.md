# 🌱 CarbonTrack (v3.0) – Smart Household Carbon Tracking Platform

**CarbonTrack** is a next-generation sustainability analytics platform designed to monitor, analyze, and offset household carbon emissions. Featuring a premium **Forest-Green Glassmorphism UI**, CarbonTrack provides actionable insights and gamified incentives to help users achieve a carbon-neutral lifestyle.

---

## 📌 Project Objective

The primary objective of CarbonTrack v3.0 is to:

- **Quantify Environmental Impact**: Real-time monitoring of household carbon footprints (Electricity, Water, Fuel, Gas).
- **AI-Driven Personalization**: Generate tailored recommendations and predictive CO2 trends.
- **Gamified Sustainability**: Encourage sustainable habits through eco-points, badges, and city-wide leaderboards.
- **Multilingual Accessibility**: Fully localized support for English, Hindi, Tamil, and Bengali.
- **Inclusive Calculations**: Updated CO2 calculator including "Non-veg" dietary impact.

---

## ✨ Key Features (v3.0)

- **🌿 Forest-Green Aesthetic**: A vibrant, modern glassmorphism design that feels alive and interactive.
- **🌍 Multi-language Support**: Seamless toggle between 4 major languages to reach a diverse user base.
- **🏎️ Dynamic Dashboard**: Real-time KPI cards for resource consumption with live trend analysis.
- **🥩 Inclusive Calculator**: Terminology updated from "Beef" to "Non-veg" for better cultural inclusivity.
- **🛡️ Hardened Data Layer**: Robust CSV-based persistence with error-handling for data integrity.
- **📈 Predictive Insights**: Forecasts next month's emissions based on historical consumption patterns.

---

## 📸 Application Preview (v3.0)

| | |
|---|---|
| ![Login Page](./screenshots/login_forest.png) <br> *Premium Glassmorphism Login* | ![Dashboard](./screenshots/dashboard_forest.png) <br> *Real-time Carbon Analytics* |
| ![Calculator](./screenshots/calculator_nonveg.png) <br> *Localized Quick CO2 Calculator* | |

---

## 🏗 System Architecture

CarbonTrack v3.0 follows a modular architecture integrating a Fast API backend and a ReactJS frontend.

### 📁 Project Structure

```text
software/
├── carbon-backend/       # Unified FastAPI Backend
│   ├── app/
│   │   ├── api/routes/   # REST API Endpoints
│   │   ├── services/     # Business Logic (CO2 Calcs, Predictions)
│   │   └── core/         # Security, Hardened DataStore, Config
│   ├── data/             # CSV-based persistence layer
│   └── main.py           # Application Entry Point
│
├── carbon-frontend/      # ReactJS (Vite) Frontend
│   ├── src/
│   │   ├── components/   # UI Components (Charts, Glass Cards)
│   │   ├── pages/        # Dashboard, Analytics, History
│   │   └── i18n.jsx      # Multi-language Dictionary
│   └── index.css         # Global Glassmorphism Styling
│
└── screenshots/          # Documentation assets
```

---

## ▶️ Setup & Installation

### 1. Backend Setup
The backend requires Python 3.10+ and a virtual environment.

```bash
cd carbon-backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Unix/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
The frontend requires Node.js and uses Vite for high-speed development.

```bash
cd carbon-frontend
npm install
npm run dev
```

---

## 👨‍💻 Contributors
Project developed as part of **Advanced Software Engineering** coursework. 
*Latest update: Week 7 Documentation Cycle — Forest-Green Design System (v3.0)*
