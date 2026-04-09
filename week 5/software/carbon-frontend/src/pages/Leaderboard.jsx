import { useState, useEffect } from "react";
import './Leaderboard.css';

const API    = "http://localhost:8000/api";
const CITIES = ["All Cities","Bengaluru","Delhi","Mumbai","Chennai","Hyderabad","Pune","Kolkata"];
const MEDAL  = { 1: "🥇", 2: "🥈", 3: "🥉" };

function apiFetch(path) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

export default function Leaderboard() {
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

  if (loading) return (
    <div className="lb-page">
      <div className="c-loading">🏅 Loading rankings…</div>
    </div>
  );

  return (
    <div className="lb-page">
      <div className="lb-header">
        <div>
          <h1 className="lb-title">🏅 Leaderboard</h1>
          <p className="lb-subtitle">Community eco-points ranking</p>
        </div>
        <select
          className="lb-select"
          value={city}
          onChange={e => setCity(e.target.value)}
        >
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {entries.map(e => (
        <div key={e.user_id} className={`lb-entry${e.rank <= 3 ? " top" : ""}`}>
          <div className={`lb-rank${e.rank <= 3 ? " medal" : ""}`}>
            {MEDAL[e.rank] || `#${e.rank}`}
          </div>
          <div style={{ flex: 1 }}>
            <p className="lb-name">{e.full_name}</p>
            <p className="lb-city">{e.city}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="lb-score">{Number(e.eco_points).toLocaleString()}</p>
            <p className="lb-score-label">pts</p>
          </div>
        </div>
      ))}
    </div>
  );
}
