import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import './History.css';

const API    = "http://localhost:8000/api";
const COLORS = { Electricity: "#F59E0B", Water: "#3B82F6", Gas: "#EF4444", Fuel: "#8B5CF6" };

function apiFetch(path) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

export default function History() {
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/emissions/monthly")
      .then(r => r.json())
      .then(d => { setMonthly(d); setLoading(false); });
  }, []);

  const chartData = [...monthly]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map(m => ({
      month:       m.period,
      Electricity: +(m.electricity_co2?.toFixed(1)) || 0,
      Water:       +(m.water_co2?.toFixed(1))       || 0,
      Gas:         +(m.gas_co2?.toFixed(1))          || 0,
      Fuel:        +(m.fuel_co2?.toFixed(1))         || 0,
    }));

  if (loading) return (
    <div className="hist-page">
      <div className="c-loading">📈 Loading history…</div>
    </div>
  );

  return (
    <div className="hist-page">
      <h1 className="hist-title">📈 Consumption History</h1>
      <p className="hist-subtitle">Your CO₂ emissions over time</p>

      {/* Trend chart */}
      <div className="hist-chart-card">
        <p className="hist-chart-title">Monthly CO₂ Trend (kg)</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" kg" />
            <Tooltip formatter={v => [`${v} kg`, ""]} />
            <Legend />
            {Object.entries(COLORS).map(([k, c]) => (
              <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown cards */}
      {[...monthly]
        .sort((a, b) => b.period.localeCompare(a.period))
        .map(m => (
          <div key={m.period} className="hist-card">
            <p className="hist-period">{m.period}</p>
            {[
              ["Electricity", m.electricity_co2],
              ["Water",       m.water_co2],
              ["Gas",         m.gas_co2],
              ["Fuel",        m.fuel_co2],
            ].map(([k, v]) => (
              <div key={k} className="hist-row">
                <span className="hist-dot" style={{ background: COLORS[k] }} />
                <span className="hist-key">{k}</span>
                <span className="hist-val">{(+v || 0).toFixed(2)} kg CO₂</span>
              </div>
            ))}
            <div className="hist-total">
              <span>Total</span>
              <span>{(+m.total_co2 || 0).toFixed(2)} kg CO₂</span>
            </div>
          </div>
        ))}
    </div>
  );
}
