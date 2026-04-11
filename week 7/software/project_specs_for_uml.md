# Project Specification: CarbonTrack (v3.0)

This document provides all the necessary details to create **Use Case**, **Class**, **Sequence**, and **Activity** diagrams for the CarbonTrack project.

---

## 1. Use Case Diagram Details

**System Boundary**: CarbonTrack Web Application

### **Actors**
1.  **Regular User (Household)**: A primary user who tracks their carbon footprint and participates in sustainability tasks.
2.  **Admin**: A system administrator who oversees the entire platform and user analytics.

### **Use Cases**
- **User Authentication**:
    - `Register`: New user creates an account with personal/household details.
    - `Login`: Existing user accesses their personalized dashboard.
- **Carbon Tracking**:
    - `Record Consumption`: Input data for Electricity (kWh), Water (Liters), Fuel (Liters), or Gas (kg).
    - `View Dashboard`: View current month's CO2 KPIs and comparisons against baselines.
    - `Generate Reports`: Export monthly/yearly emission data as PDF/JSON.
- **Gamification & Goals**:
    - `Set Carbon Goals`: Define a monthly CO2 budget.
    - `Log Eco-Actions`: Mark sustainability tasks (e.g., "Planted a Tree") as completed.
    - `View Badges`: Earn and view rewards for reaching milestones.
    - `Track Points/Rank`: View leaderboard position via the Incentive system.
- **Intelligence & Notifications**:
    - `Get AI Predictions`: View forecasted CO2 trends based on historical data.
    - `View Recommendations`: Receive personalized tips to reduce footprint.
    - `Receive Notifications`: Get alerts for low budgets, new badges, or system updates.
- **Admin Specific**:
    - `View System Analytics`: Monitor global CO2 trends and top emitters.
    - `User Management`: Promote users to admin or reset/delete specialized user data.

---

## 2. Class Diagram Details

### **Core Components**
- **DataStore (Singleton)**: Manages all CSV-based dataframes and file I/O operations.

### **Data Entities (Attributes)**
1.  **User**
    - `user_id` (int), `full_name` (str), `email` (str), `password_hash` (str), `role` (str), `household_size` (int), `city` (str), `created_at` (datetime).
2.  **ConsumptionRecord** (Abstract Concept used in CSVs)
    - `user_id` (int), `date` (datetime), `quantity` (float).
    - *Types*: Electricity (kWh), Water (L), Fuel (L), Gas (kg).
3.  **DailyEmission**
    - `emission_id` (int), `user_id` (int), `date` (datetime), `resource_type` (str), `quantity` (float), `co2_emission` (float).
4.  **CarbonSummary**
    - `summary_id` (int), `user_id` (int), `period` (str - YYYY-MM), `total_co2` (float), `electricity_co2` (float), `water_co2` (float), `fuel_co2` (float), `gas_co2` (float).
5.  **UserGoal**
    - `goal_id` (int), `user_id` (int), `monthly_budget_kg` (float).
6.  **EcoAction**
    - `action_id` (int), `title` (str), `points` (int), `category` (str), `description` (str).
7.  **Incentive (Loyalty)**
    - `incentive_id` (int), `user_id` (int), `eco_points` (int), `rank` (str).
8.  **Badge**
    - `id` (int), `user_id` (int), `badge_type` (str), `awarded_at` (datetime).

### **Relationships**
- `User` **(1) ── (*)** `ConsumptionRecord`
- `User` **(1) ── (*)** `DailyEmission`
- `User` **(1) ── (1)** `Incentive`
- `User` **(1) ── (*)** `UserGoal`
- `User` **(1) ── (*)** `Badge`
- `User` **(1) ── (*)** `UserAction` **(*) ── (1)** `EcoAction`

---

## 3. Sequence Diagram Details: "Record Consumption"

**Flow**: User Logs Daily Electricity Consumption
1.  **User** Fill Electricity Form (Date, kWh) on **Frontend**.
2.  **Frontend** sends POST request to `/api/consumption/electricity`.
3.  **ConsumptionRouter** receives request and extracts `user_id`.
4.  **EmissionService** calls `calc_co2(quantity, 'electricity')`.
5.  **EmissionService** retrieves emission factor for electricity from **Config/CSV**.
6.  **EmissionService** calculates `co2 = quantity * factor`.
7.  **EmissionService** calls **DataStore** to `record_emission` (Save to `daily_emissions.csv`).
8.  **EmissionService** calls `compute_monthly_summary` to update the user's aggregated totals.
9.  **DataStore** saves data to `carbon_footprint_summary.csv`.
10. **API Response** returns Calculated CO2 and Success Message to **User**.

---

## 4. Activity Diagram Details: "Monthly Summary Calculation"

**Process**: Recalculating totals for a specific month (`YYYY-MM`)
1.  **Start**
2.  **Input**: `user_id`, `period`.
3.  **Action**: Filter `daily_emissions` where `user_id` matches and `date` falls within `period`.
4.  **Action**: Group by `resource_type`.
5.  **Action**: Sum `co2_emission` for each group (Electricity, Water, Fuel, Gas).
6.  **Action**: Calculate `total_co2` = Sum of all groups.
7.  **Decision**: Does a record for this `user_id` and `period` already exist in `carbon_summary`?
    - If **Yes**: Update existing row with new totals.
    - If **No**: Create a new row with a new `summary_id`.
8.  **Action**: Trigger **DataStore** to persistence (Save CSV).
9.  **End**

---
