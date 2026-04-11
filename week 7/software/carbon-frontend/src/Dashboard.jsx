import { useState, useEffect, useCallback } from "react";
import SocialProofCard  from "./components/SocialProofCard";
import NatureCard       from "./components/NatureCard";
import GoalCard         from "./components/GoalCard";
import ActionsCard      from "./components/ActionsCard";
import WeatherCard      from "./components/WeatherCard";
import EmissionsChart   from "./components/EmissionsChart";
import BadgesCard       from "./components/BadgesCard";
import PredictionCard   from "./components/PredictionCard";
import './Dashboard.css';

const API = "http://localhost:8000/api";

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

export default function Dashboard({ onNavigate, darkMode, setDarkMode }) {
  const name = localStorage.getItem("full_name") || localStorage.getItem("name") || "User";
  const [dash,    setDash]    = useState(null);
  const [actions, setActions] = useState({ completed: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [d, a] = await Promise.all([
        apiFetch("/dashboard/").then(r => r.json()),
        apiFetch("/actions/me").then(r => r.json()),
      ]);
      setDash(d);
      setActions(a);
      if (d.newly_awarded?.length > 0) {
        setToast(`🏅 Badge unlocked: ${d.newly_awarded[0].emoji} ${d.newly_awarded[0].name}`);
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const iv = setInterval(loadAll, 60000);
    return () => clearInterval(iv);
  }, [loadAll]);

  const downloadReport = async () => {
    const token = localStorage.getItem("token");
    const r     = await fetch(`${API}/reports/monthly`, { headers: { Authorization: `Bearer ${token}` } });
    const blob  = await r.blob();
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement("a");
    a.href      = url;
    a.download  = `carbon_report_${new Date().toISOString().slice(0, 7)}.pdf`;
    a.click();
    apiFetch("/badges/report-downloaded", { method: "POST" });
  };

  const handleSetGoal = async (budget) => {
    await apiFetch("/goals/", { method: "POST", body: JSON.stringify({ monthly_budget_kg: budget }) });
    loadAll();
  };

  const handleCompleteAction = async (actionId) => {
    const res  = await apiFetch("/actions/complete", { method: "POST", body: JSON.stringify({ action_id: actionId }) });
    const data = await res.json();
    loadAll();
    return data;
  };

  if (loading) return (
    <div className={`dash-page${darkMode ? " dark" : ""}`}>
      <div className="c-loading">🌿 Loading your footprint…</div>
    </div>
  );

  const incentive = dash?.incentive;
  const breakdown = dash?.kpis?.map(k => ({ resource: k.category, co2_kg: k.co2_kg })) || [];
  const period    = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const badges    = dash?.badges || [];
  const unread    = dash?.unread_notifications || 0;

  const goalPct = dash?.goal_status
    ? Math.min(100, Math.round((dash.goal_status.current_co2_kg / (dash.goal_status.monthly_budget_kg || 1)) * 100))
    : null;

  const summaryTiles = [
    { label: "Total CO₂",  value: `${(dash?.total_co2 || 0).toFixed(1)} kg`, icon: "💨", accent: true },
    { label: "Eco-Points", value: (incentive?.eco_points || 0).toLocaleString(), icon: "⭐" },
    { label: "City Rank",  value: `#${incentive?.rank || "—"}`, icon: "🏅" },
  ];

  return (
    <div className={`dash-page${darkMode ? " dark" : ""}`}>
      {toast && <div className="dash-toast">{toast}</div>}

      <header className="c-navbar">
        <div className="c-navbar-brand">
          <div className="c-navbar-brand-dot">🌿</div>
          CarbonTrack
        </div>
        <div className="c-navbar-right">
          <span className="c-navbar-stat">
            {incentive?.eco_points || 0} pts · Rank #{incentive?.rank || "—"}
          </span>
          <button className="btn-sm-dark" onClick={downloadReport}>📄 Report</button>
          <button className="btn-icon notif-bell" onClick={() => onNavigate && onNavigate("notifications")} title="Notifications">
            🔔
            {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
          <button className="btn-icon" onClick={() => setDarkMode && setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="dash-inner">
        <p className="dash-greeting">Hello, {name.split(" ")[0]} 👋</p>
        <p className="dash-sub">{period} · Carbon Footprint Dashboard</p>

        {goalPct !== null && (
          <div className="goal-progress-bar">
            <div className="goal-progress-meta">
              <span>Monthly Budget</span>
              <span style={{ color: goalPct >= 100 ? "#ef4444" : goalPct >= 80 ? "#f59e0b" : "#22c55e" }}>
                {dash.goal_status.current_co2_kg.toFixed(1)} / {dash.goal_status.monthly_budget_kg} kg ({goalPct}%)
              </span>
            </div>
            <div className="goal-progress-track">
              <div className="goal-progress-fill" style={{
                width: `${goalPct}%`,
                background: goalPct >= 100 ? "#ef4444" : goalPct >= 80 ? "#f59e0b" : "#c8ff00",
              }} />
            </div>
          </div>
        )}

        <div className="summary-grid">
          {summaryTiles.map(t => (
            <div key={t.label} className={`summary-tile${t.accent ? " accent-tile" : ""}`}>
              <div className="tile-icon">{t.icon}</div>
              <div>
                <p className="tile-label">{t.label}</p>
                <p className="tile-value">{t.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-grid">
          <EmissionsChart breakdown={breakdown} darkMode={darkMode} />
          <PredictionCard prediction={dash?.prediction} />
          <SocialProofCard data={dash?.social_proof} />
          <NatureCard data={dash?.nature_equivalents} />
          <GoalCard goal={dash?.goal_status} onSetGoal={handleSetGoal} />
          <WeatherCard weather={dash?.weather} />
          {badges.length > 0 && <BadgesCard badges={badges} />}
          <div className="grid-col-2">
            <ActionsCard
              completed={actions.completed || []}
              pending={actions.pending   || []}
              onComplete={handleCompleteAction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
