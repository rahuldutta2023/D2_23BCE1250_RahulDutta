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
- **📈 Predictive Insights**: Forecasts next month's emissions based on historical consumption patterns.
- **🛡️ Hardened Data Layer**: Robust CSV-based persistence with error-handling for data integrity.
- **🏆 Global Leaderboard**: Compare eco-scores with other users and climb the ranks of sustainability.
- **🛠️ Admin Control Center**: Comprehensive dashboard for system monitoring and user management.

---

## 🛠 Tech Stack

| Component | Technology | Use Case |
|---|---|---|
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi) | High-performance REST API |
| **Logic/Data** | ![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat&logo=pandas) | Data processing & CSV persistence |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react) | Modern component-based UI |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css) | Utility-first glassmorphism styling |
| **Visualization** | ![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=flat) | Dynamic emission trend charts |
| **Reports** | ![ReportLab](https://img.shields.io/badge/ReportLab-blue?style=flat) | Automated PDF report generation |

---

## 🎨 Design DNA: Forest-Green Glassmorphism

CarbonTrack v3.0 utilizes a custom-built design system focused on:
1. **Visual Depth**: Multi-layered frosted glass effects using `backdrop-filter: blur()`.
2. **Eco-Harmony**: A curated palette of #1b4332 (Deep Forest), #2d6a4f (Emerald), and #95d5b2 (Sage).
3. **Micro-Interactions**: Smooth CSS transitions on all goal cards and action items.
4. **Accessibility**: High-contrast text on translucent backgrounds for maximum readability.

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
│   │   └── i18n/         # Multi-language Dictionary
│   └── index.css         # Global Glassmorphism Styling
│
└── screenshots/          # Documentation assets
```

---

## 📡 API Reference (v3.0)

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/` | `POST` | User registration and JWT-based login |
| `/api/dashboard/` | `GET` | Aggregated monthly stats & KPI cards |
| `/api/consumption/`| `POST` | Log new resource usage (Electricity, Water, etc.) |
| `/api/predictions/`| `GET` | ML-based emission forecasting for next month |
| `/api/reports/` | `GET` | Generate and download PDF sustainability reports |
| `/api/admin/` | `GET` | System-wide audit logs and user statistics |

---

## 🔒 Security & Data Integrity

- **JWT Authentication**: Secure stateless authentication for all protected routes.
- **Hardened Persistence**: The CSV data layer includes validation checks to prevent data corruption.
- **CORS Management**: Strict origin filtering to protect against unauthorized frontend requests.
- **Environment Isolation**: Sensitive credentials and API keys are managed via `.env` files.

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

### 3. Environment Configuration
Create a `.env` file in the `carbon-backend` directory:
```env
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 👨‍💻 Contributors
Project developed as part of **Advanced Software Engineering** coursework. 
*Latest update: Week 7 Documentation Cycle — Forest-Green Design System (v3.0)*
