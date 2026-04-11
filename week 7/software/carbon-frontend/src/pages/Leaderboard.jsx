import { useState, useEffect } from "react";
import { useLang } from "../i18n";
import './Leaderboard.css';

const API    = "http://localhost:8000/api";
const CITIES = ["All Cities","Bengaluru","Delhi","Mumbai","Chennai","Hyderabad","Pune","Kolkata"];
const MEDAL  = { 1: "🥇", 2: "🥈", 3: "🥉" };

function apiFetch(path) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

export default function Leaderboard() {
  const { t } = useLang();
  const [entries, setEntries] = useState([]);
  const [city,    setCity]    = useState("All Cities");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = city !== "All Cities" ? `?city=${city}` : "";
    apiFetch(`/incentives/leaderboard${q}`)
      .then(r => r.json())
      .then(d => { setEntries(d); setLoading(false); });
  }, [city]);

  const myId = parseInt(localStorage.getItem("user_id") || "0");

  if (loading) return (
    <div className="lb-page">
      <div className="c-loading">🏅 {t("leaderboard")}…</div>
    </div>
  );

  return (
    <div className="lb-page">
      <div className="lb-header">
        <div>
          <h1 className="lb-title">🏅 {t("leaderboard")}</h1>
          <p className="lb-subtitle">{t("communityRanking")}</p>
        </div>
        <select id="lb-city-filter" className="lb-select" value={city} onChange={e => setCity(e.target.value)}>
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="lb-inner-pad">
        {entries.map(e => (
          <div key={e.user_id} className={`lb-entry${e.rank <= 3 ? " top" : ""}${e.user_id === myId ? " me" : ""}`}>
            <div className={`lb-rank${e.rank <= 3 ? " medal" : ""}`}>
              {MEDAL[e.rank] || `#${e.rank}`}
            </div>
            <div style={{ flex: 1 }}>
              <p className="lb-name">{e.full_name}{e.user_id === myId ? " (you)" : ""}</p>
              <p className="lb-city">{e.city}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="lb-score">{Number(e.eco_points).toLocaleString()}</p>
              <p className="lb-score-label">pts</p>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", padding: "3rem", fontSize: "0.9rem" }}>
            {t("noEntries")}
          </div>
        )}
      </div>
    </div>
  );
}
