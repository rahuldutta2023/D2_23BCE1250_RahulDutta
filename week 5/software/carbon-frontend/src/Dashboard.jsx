import { useState, useEffect } from "react";
import SocialProofCard from "./components/SocialProofCard";
import NatureCard      from "./components/NatureCard";
import GoalCard        from "./components/GoalCard";
import ActionsCard     from "./components/ActionsCard";
import WeatherCard     from "./components/WeatherCard";
import EmissionsChart  from "./components/EmissionsChart";
import './Dashboard.css';

const API = "http://localhost:8000/api";

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
}

export default function Dashboard() {
  const name = localStorage.getItem("full_name") || localStorage.getItem("name") || "User";
  const [dash,     setDash]     = useState(null);
  const [actions,  setActions]  = useState({ completed: [], pending: [] });
  const [darkMode, setDarkMode] = useState(false);
  const [loading,  setLoading]  = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, a] = await Promise.all([
        apiFetch("/dashboard/").then(r => r.json()),
        apiFetch("/actions/me").then(r => r.json()),
      ]);
      setDash(d);
      setActions(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const downloadReport = () => {
    const token = localStorage.getItem("token");
    fetch(`${API}/reports/monthly`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href    = url;
        a.download = `carbon_report_${new Date().toISOString().slice(0, 7)}.pdf`;
        a.click();
      });
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

  const summaryTiles = [
    { label: "Total CO₂",  value: `${(dash?.total_co2 || 0).toFixed(1)} kg`, icon: "💨", accent: true },
    { label: "Eco-Points", value: incentive?.eco_points || 0,                 icon: "⭐" },
    { label: "City Rank",  value: `#${incentive?.rank || "—"}`,               icon: "🏅" },
  ];

  return (
    <div className={`dash-page${darkMode ? " dark" : ""}`}>

      {/* Navbar */}
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
          <button className="btn-icon" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="dash-inner">
        {/* Greeting */}
        <p className="dash-greeting">Hello, {name.split(" ")[0]} 👋</p>
        <p className="dash-sub">{period} · Carbon Footprint</p>

        {/* Summary strip */}
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

        {/* Card grid */}
        <div className="dash-grid">
          <EmissionsChart breakdown={breakdown} />
          <SocialProofCard data={dash?.social_proof} />
          <NatureCard data={dash?.nature_equivalents} />
          <GoalCard goal={dash?.goal_status} onSetGoal={handleSetGoal} />
          <WeatherCard weather={dash?.weather} />
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
