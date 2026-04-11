import { useState, useEffect, useCallback } from "react";
import SocialProofCard  from "./components/SocialProofCard";
import NatureCard       from "./components/NatureCard";
import GoalCard         from "./components/GoalCard";
import ActionsCard      from "./components/ActionsCard";
import WeatherCard      from "./components/WeatherCard";
import EmissionsChart   from "./components/EmissionsChart";
import BadgesCard       from "./components/BadgesCard";
import PredictionCard   from "./components/PredictionCard";
import { useLang, LANGUAGES } from "./i18n";
import './Dashboard.css';

const API = "http://localhost:8000/api";

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

/* ─── Animated Counter ─── */
function AnimCounter({ target, decimals = 1 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const from = 0;
    const duration = 900;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(from + (target - from) * ease);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return <span>{val.toFixed(decimals)}</span>;
}

/* ─── Eco Tips Carousel ─── */
function EcoTipsBar({ t }) {
  const [idx, setIdx] = useState(0);
  const tips = [t("tip1"), t("tip2"), t("tip3"), t("tip4"), t("tip5"), t("tip6")];
  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % tips.length), 7000);
    return () => clearInterval(iv);
  }, [tips.length]);
  return (
    <div className="eco-tips-bar">
      <span className="eco-tips-label">{t("ecoTips")}</span>
      <span className="eco-tips-text">{tips[idx]}</span>
      <div className="eco-tips-nav">
        <button className="eco-tips-btn" onClick={() => setIdx(i => (i - 1 + tips.length) % tips.length)}>‹</button>
        <button className="eco-tips-btn" onClick={() => setIdx(i => (i + 1) % tips.length)}>›</button>
      </div>
    </div>
  );
}

/* ─── CO₂ Calculator Modal ─── */
function CO2Modal({ onClose, t }) {
  const [drive,   setDrive]   = useState("");
  const [flights, setFlights] = useState("");
  const [nonVeg,   setNonVeg]   = useState("");
  const [result,  setResult]  = useState(null);

  const calculate = () => {
    const km      = parseFloat(drive)   || 0;
    const fl      = parseFloat(flights) || 0;
    const nv      = parseFloat(nonVeg)    || 0;
    const carCO2  = km * 0.21 * 365;
    const flyCO2  = fl * 255;
    const nonVegCO2 = nv * 52 * 3.3;
    setResult((carCO2 + flyCO2 + nonVegCO2).toFixed(1));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <p className="modal-title">🌿 {t("co2Calc")}</p>
        <p className="modal-sub">{t("calcSubtitle")}</p>

        {[
          { label: t("drive"),   val: drive,   set: setDrive,   id: "calc-drive" },
          { label: t("flights"), val: flights, set: setFlights, id: "calc-flights" },
          { label: t("nonVeg"),  val: nonVeg,  set: setNonVeg,  id: "calc-non-veg" },
        ].map(({ label, val, set, id }) => (
          <div className="modal-field" key={id}>
            <label className="modal-label">{label}</label>
            <input
              id={id}
              className="modal-input"
              type="number"
              min="0"
              value={val}
              onChange={e => set(e.target.value)}
              placeholder="0"
            />
          </div>
        ))}

        {result !== null && (
          <div className="modal-result">
            <p className="modal-result-label">{t("calcResult")}</p>
            <p className="modal-result-value">{result} <span className="modal-result-unit">kg CO₂ / {t("today").toLowerCase()}</span></p>
          </div>
        )}

        <div className="modal-actions">
          <button id="btn-calculate" className="btn-calc" onClick={calculate}>{t("calculate")}</button>
          <button id="btn-close-calc" className="btn-close-modal" onClick={onClose}>✕</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
export default function Dashboard({ onNavigate }) {
  const { lang, changeLang, t, LANGUAGES } = useLang();
  const name    = localStorage.getItem("full_name") || localStorage.getItem("name") || "User";
  const [dash,    setDash]    = useState(null);
  const [actions, setActions] = useState({ completed: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const [showCalc, setShowCalc] = useState(false);

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
    <div className="dash-page">
      <div className="c-loading">🌿 {t("loading")}</div>
    </div>
  );

  const incentive  = dash?.incentive;
  const breakdown  = dash?.kpis?.map(k => ({ resource: k.category, co2_kg: k.co2_kg })) || [];
  const period     = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const badges     = dash?.badges || [];
  const unread     = dash?.unread_notifications || 0;
  const totalCO2   = dash?.total_co2 || 0;

  const goalPct = dash?.goal_status
    ? Math.min(100, Math.round((dash.goal_status.current_co2_kg / (dash.goal_status.monthly_budget_kg || 1)) * 100))
    : null;

  const summaryTiles = [
    { label: t("totalCO2"),  value: totalCO2, suffix: " kg", icon: "💨", accent: true, counter: true },
    { label: t("ecoPoints"), value: incentive?.eco_points || 0, suffix: "", icon: "⭐", counter: false },
    { label: t("cityRank"),  value: `#${incentive?.rank || "—"}`, suffix: "", icon: "🏅", counter: false },
  ];

  return (
    <div className="dash-page">
      {toast && <div className="dash-toast">{toast}</div>}
      {showCalc && <CO2Modal onClose={() => setShowCalc(false)} t={t} />}

      {/* ─── Navbar ─── */}
      <header className="c-navbar">
        <div className="c-navbar-brand">
          <div className="c-navbar-brand-dot">🌿</div>
          {t("appName")}
        </div>
        <div className="c-navbar-right">
          <span className="c-navbar-stat">
            {incentive?.eco_points || 0} pts · {t("cityRank")} #{incentive?.rank || "—"}
          </span>

          {/* Language selector */}
          <select
            id="lang-selector"
            className="lang-select"
            value={lang}
            onChange={e => changeLang(e.target.value)}
            title="Language"
          >
            {Object.entries(LANGUAGES).map(([code, info]) => (
              <option key={code} value={code}>{info.flag} {info.name}</option>
            ))}
          </select>

          <button id="btn-report" className="btn-sm-dark" onClick={downloadReport}>📄 {t("report")}</button>
          <button
            id="btn-notifications"
            className="btn-icon notif-bell"
            onClick={() => onNavigate && onNavigate("notifications")}
            title="Notifications"
          >
            🔔
            {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
        </div>
      </header>

      {/* ─── Content ─── */}
      <div className="dash-inner">
        <p className="dash-greeting">{t("hello")}, {name.split(" ")[0]} 👋</p>
        <p className="dash-sub">{period} · {t("carbonDashboard")}</p>

        {/* Eco Tips Carousel */}
        <div style={{ marginTop: "1rem" }}>
          <EcoTipsBar t={t} />
        </div>

        {/* Goal progress */}
        {goalPct !== null && (
          <div className="goal-progress-bar">
            <div className="goal-progress-meta">
              <span>{t("monthlyBudget")}</span>
              <span style={{ color: goalPct >= 100 ? "#ef4444" : goalPct >= 80 ? "#f59e0b" : "#a8d55e" }}>
                {dash.goal_status.current_co2_kg.toFixed(1)} / {dash.goal_status.monthly_budget_kg} kg ({goalPct}%)
              </span>
            </div>
            <div className="goal-progress-track">
              <div className="goal-progress-fill" style={{
                width: `${goalPct}%`,
                background: goalPct >= 100 ? "#ef4444" : goalPct >= 80 ? "#f59e0b" : "var(--accent)",
              }} />
            </div>
          </div>
        )}

        {/* Summary tiles */}
        <div className="summary-grid">
          {summaryTiles.map(tile => (
            <div key={tile.label} className={`summary-tile${tile.accent ? " accent-tile" : ""}`}>
              <div className="tile-icon">{tile.icon}</div>
              <div>
                <p className="tile-label">{tile.label}</p>
                <p className="tile-value">
                  {tile.counter
                    ? <><AnimCounter target={parseFloat(tile.value)} />{tile.suffix}</>
                    : `${tile.value}${tile.suffix}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Card grid */}
        <div className="dash-grid">
          <EmissionsChart breakdown={breakdown} />
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

      {/* ─── Floating CO₂ Calculator Button ─── */}
      <button id="btn-co2-calc" className="calc-fab" onClick={() => setShowCalc(true)}>
        🧮 {t("co2Calc")}
      </button>
    </div>
  );
}
