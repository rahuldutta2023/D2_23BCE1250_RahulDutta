# 🌱 CarbonTrack (v3.0) – Smart Household Carbon Tracking platform

CarbonTrack is a next-generation sustainability analytics platform designed to monitor, analyze, and offset household carbon emissions. By tracking resource consumption patterns—including electricity, water, transportation fuel, and cooking gas—CarbonTrack provides actionable insights and gamified incentives to help users achieve a carbon-neutral lifestyle.

---

## 📌 Project Objective

The primary objective of CarbonTrack v3.0 is to:

- **Quantify Environmental Impact**: Real-time monitoring of household carbon footprints.
- **AI-Driven Personalization**: Generate tailored recommendations and predictive CO2 trends.
- **Gamified Sustainability**: Encourage sustainable habits through eco-points, badges, and national leaderboards.
- **Aggregated Analytics**: Provide comparative peer analysis and community-wide emission trends.
- **Automated Reporting**: Generate professional-grade sustainability reports in PDF/JSON formats.

---

## 🏗 System Architecture & Visualization

CarbonTrack v3.0 follows a robust modular architecture, integrating a FastAPI backend, a ReactJS frontend, and an intelligent data persistence layer.

### 1. Use Case Diagram
Detailed interaction between Regular Users and Administrators.

```mermaid
graph TD
    User((Regular User))
    Admin((Admin))
    
    subgraph "CarbonTrack Web Application"
        UC1(User Authentication)
        UC2(Record Consumption)
        UC3(View Dashboard)
        UC4(Generate Reports)
        UC5(Set Carbon Goals)
        UC6(Log Eco-Actions)
        UC7(View Badges & Points)
        UC8(Get AI Predictions)
        UC9(View Recommendations)
        UC10(View System Analytics)
        UC11(User Management)
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    
    Admin --> UC1
    Admin --> UC10
    Admin --> UC11
```

### 2. Class Diagram
Core data entities and their underlying relationships.

```mermaid
classDiagram
    class User {
        +int user_id
        +string full_name
        +string email
        +string role
        +int household_size
        +string city
        +datetime created_at
    }
    class ConsumptionRecord {
        +int user_id
        +datetime date
        +float quantity
        +string type
    }
    class DailyEmission {
        +int emission_id
        +int user_id
        +datetime date
        +string resource_type
        +float quantity
        +float co2_emission
    }
    class CarbonSummary {
        +int summary_id
        +int user_id
        +string period
        +float total_co2
        +float electricity_co2
        +float water_co2
        +float fuel_co2
        +float gas_co2
    }
    class UserGoal {
        +int goal_id
        +int user_id
        +float monthly_budget_kg
    }
    class Incentive {
        +int incentive_id
        +int user_id
        +int eco_points
        +string rank
    }
    class Badge {
        +int id
        +int user_id
        +string badge_type
        +datetime awarded_at
    }
    
    User "1" -- "*" ConsumptionRecord
    User "1" -- "*" DailyEmission
    User "1" -- "1" Incentive
    User "1" -- "*" UserGoal
    User "1" -- "*" Badge
```

### 3. Sequence Diagram: Recording Consumption
Visualizing the data flow during an emission logging event.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant EmissionService
    participant DataStore
    
    User->>Frontend: Submit Consumption (e.g. Electricity kWh)
    Frontend->>API: POST /api/consumption/electricity
    API->>EmissionService: calc_co2(quantity, 'electricity')
    EmissionService->>EmissionService: Apply Emission Factor
    EmissionService->>DataStore: record_emission()
    EmissionService->>EmissionService: compute_monthly_summary()
    EmissionService->>DataStore: update_summary()
    DataStore-->>EmissionService: Success
    EmissionService-->>API: Result
    API-->>Frontend: Success Response
    Frontend-->>User: Visual Update & Notification
```

### 4. Activity Diagram: Monthly Consolidation
Logic for recalculating monthly aggregates and budget tracking.

```mermaid
stateDiagram-v2
    [*] --> Start
    Start --> FilterDailyEmissions: Input user_id, period
    FilterDailyEmissions --> GroupByResourceType
    GroupByResourceType --> SumCO2ByGroup
    SumCO2ByGroup --> CalculateTotalCO2
    CalculateTotalCO2 --> CheckExistingRecord
    CheckExistingRecord --> UpdateRow: Found Record?
    CheckExistingRecord --> CreateNewRow: No Record?
    UpdateRow --> Persistence
    CreateNewRow --> Persistence
    Persistence --> [*]
```

---

## 🔑 Key Features (v3.0)

- **Gamification Suite**: Earn Eco-Points and dynamic Badges for low-carbon streaks and sustainability tasks.
- **Smart Budgeting**: Set monthly CO2 limits and receive proactive "Warning" alerts as you approach thresholds.
- **Eco-Action Trackers**: Log specific positive actions (e.g., composting, LED upgrades) to see direct carbon offsets.
- **Advanced Visualization**: Interactive bar, pie, and line charts for historical trend analysis.
- **Peer Benchmarking**: Compare your footprint with city averages and top performers in your region.
- **Localized Insights**: Integration with local weather data (e.g., Mumbai today) to provide relevant energy-saving tips.

---

## 📸 Application Screenshots (Week 7)

| | |
|---|---|
| ![Login Page](file:///e:/GitHub/D2_23BCE1250_RahulDutta/week%207/screenshots/Screenshot%202026-03-02%20195225.png) <br> *Sleek, Dark-themed Login* | ![Monthly Report](file:///e:/GitHub/D2_23BCE1250_RahulDutta/week%207/screenshots/Screenshot%202026-03-02%20222928.png) <br> *Automated Sustainability PDF Report* |
| ![Dashboard](file:///e:/GitHub/D2_23BCE1250_RahulDutta/week%207/screenshots/Screenshot%202026-03-02%20223152.png) <br> *User Dashboard & Nature Equivalents* | ![Eco-Actions](file:///e:/GitHub/D2_23BCE1250_RahulDutta/week%207/screenshots/Screenshot%202026-03-02%20223406.png) <br> *Gamified Task Checklist & Forecasts* |
| ![History](file:///e:/GitHub/D2_23BCE1250_RahulDutta/week%207/screenshots/Screenshot%202026-03-02%20223433.png) <br> *Historical Emission Trends* | ![Leaderboard](file:///e:/GitHub/D2_23BCE1250_RahulDutta/week%207/screenshots/Screenshot%202026-03-02%20223505.png) <br> *Global Sustainability Leaderboard* |

---

## 📁 Project Structure

```
carbon-frontend/
├── src/
│   ├── components/       # UI Components (Charts, Modals, etc.)
│   ├── pages/            # View Layers (Dashboard, History, etc.)
│   ├── App.jsx           # Routing logic
│   └── global.css        # Premium Dark UI Styling
```

```
carbon-backend/
├── app/
│   ├── api/routes/       # REST API Endpoints
│   ├── services/         # Business Logic (CO2 Calcs, Incentives)
│   ├── core/             # Security, Persistence, Config
│   └── main.py           # Application Entry Point
├── data/                 # CSV-based persistence layer
└── requirements.txt      # System dependencies
```

---

## ▶️ Setup & Installation

### Backend
```bash
cd carbon-backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd carbon-frontend
npm install
npm run dev
```

---

## 👨‍💻 Contributors

Project developed as part of **Software Engineering** coursework. 
*Latest update: Week 7 Documentation Cycle (v3.0)*