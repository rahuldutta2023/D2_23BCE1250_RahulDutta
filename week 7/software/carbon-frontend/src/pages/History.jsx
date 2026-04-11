import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid, Cell,
} from "recharts";
import './History.css';

const API    = "http://localhost:8000/api";
const COLORS = { Electricity: "#f59e0b", Water: "#3b82f6", Gas: "#ef4444", Fuel: "#8b5cf6" };
const BAR_COLORS = ["#c8ff00", "#9acc00", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

function apiFetch(path) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

export default function History() {
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState("trend");

  useEffect(() => {
    apiFetch("/emissions/monthly")
      .then(r => r.json())
      .then(d => { setMonthly(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...monthly].sort((a, b) => a.period.localeCompare(b.period));

  const chartData = sorted.map(m => ({
    month:       m.period,
    Electricity: +(m.electricity_co2?.toFixed(1)) || 0,
    Water:       +(m.water_co2?.toFixed(1))       || 0,
    Gas:         +(m.gas_co2?.toFixed(1))          || 0,
    Fuel:        +(m.fuel_co2?.toFixed(1))         || 0,
    Total:       +(m.total_co2?.toFixed(1))        || 0,
  }));

  // Month-over-month comparison (last two months)
  const recentTwo = sorted.slice(-2);
  const comparisonData = recentTwo.length === 2
    ? ["Electricity", "Water", "Gas", "Fuel"].map(key => {
        const prev  = recentTwo[0];
        const curr  = recentTwo[1];
        const prevV = +(prev[`${key.toLowerCase()}_co2`]?.toFixed(2)) || 0;
        const currV = +(curr[`${key.toLowerCase()}_co2`]?.toFixed(2)) || 0;
        const delta = +(currV - prevV).toFixed(2);
        return { category: key, [prev.period]: prevV, [curr.period]: currV, delta };
      })
    : [];

  // Best and worst months
  const best  = sorted.reduce((a, b) => (+a.total_co2||999) < (+b.total_co2||999) ? a : b, sorted[0]);
  const worst = sorted.reduce((a, b) => (+a.total_co2||0) > (+b.total_co2||0) ? a : b, sorted[0]);

  if (loading) return (
    <div className="hist-page">
      <div className="c-loading">📈 Loading history…</div>
    </div>
  );

  return (
    <div className="hist-page">
      <div className="hist-inner">
        <h1 className="hist-title">📈 Emissions History</h1>
        <p className="hist-subtitle">Your CO₂ footprint over time</p>

        {/* Best/worst callout */}
        {sorted.length >= 2 && (
          <div className="hist-callout-row">
            <div className="hist-callout best">
              <p className="hist-callout-label">🌟 Best Month</p>
              <p className="hist-callout-period">{best?.period}</p>
              <p className="hist-callout-value">{(+best?.total_co2||0).toFixed(1)} kg</p>
            </div>
            <div className="hist-callout worst">
              <p className="hist-callout-label">⚠️ Highest Month</p>
              <p className="hist-callout-period">{worst?.period}</p>
              <p className="hist-callout-value">{(+worst?.total_co2||0).toFixed(1)} kg</p>
            </div>
          </div>
        )}

        {/* View toggle */}
        <div className="hist-view-toggle">
          {["trend", "comparison", "breakdown"].map(v => (
            <button
              key={v}
              className={`hist-view-btn${view === v ? " active" : ""}`}
              onClick={() => setView(v)}
            >
              {v === "trend" ? "📉 Trend" : v === "comparison" ? "⚖️ Compare" : "📊 Breakdown"}
            </button>
          ))}
        </div>

        {/* Trend view */}
        {view === "trend" && (
          <div className="hist-chart-card">
            <p className="hist-chart-title">Monthly CO₂ Trend (kg)</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} unit=" kg" />
                <Tooltip formatter={v => [`${v} kg`, ""]} contentStyle={{ borderRadius: 12, fontSize: 12, background: "rgba(14,40,18,0.92)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                <Legend />
                {Object.entries(COLORS).map(([k, c]) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Month-over-month comparison */}
        {view === "comparison" && (
          <div className="hist-chart-card">
            {comparisonData.length > 0 ? (
              <>
                <p className="hist-chart-title">
                  Month-over-Month: {recentTwo[0]?.period} vs {recentTwo[1]?.period}
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparisonData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                    <XAxis dataKey="category" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.45)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} unit=" kg" />
                    <Tooltip formatter={v => [`${v} kg`, ""]} contentStyle={{ borderRadius: 12, fontSize: 12, background: "rgba(14,40,18,0.92)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                    <Legend formatter={v => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
                    <Bar dataKey={recentTwo[0]?.period} fill="#d1d5db" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={recentTwo[1]?.period} radius={[4, 4, 0, 0]}>
                      {comparisonData.map((entry, i) => (
                        <Cell key={i} fill={entry.delta <= 0 ? "#a8d55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="hist-delta-row">
                  {comparisonData.map(d => (
                    <div key={d.category} className="hist-delta-item">
                      <span className="hist-delta-cat">{d.category}</span>
                      <span className="hist-delta-val" style={{ color: d.delta <= 0 ? "#22c55e" : "#ef4444" }}>
                        {d.delta > 0 ? "+" : ""}{d.delta} kg
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.35)", padding: "2rem", textAlign: "center" }}>
                Log at least 2 months to see comparison.
              </p>
            )}
          </div>
        )}

        {view === "breakdown" && (
          <div className="hist-chart-card">
            <p className="hist-chart-title">Total CO₂ per Month (kg)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} unit=" kg" />
                <Tooltip formatter={v => [`${v} kg`, "Total"]} contentStyle={{ borderRadius: 12, fontSize: 12, background: "rgba(14,40,18,0.92)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                <Bar dataKey="Total" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}


        {/* Monthly detail cards */}
        {[...monthly].sort((a, b) => b.period.localeCompare(a.period)).map(m => (
          <div key={m.period} className="hist-card">
            <div className="hist-card-header">
              <p className="hist-period">{m.period}</p>
              <p className="hist-total-val">{(+m.total_co2 || 0).toFixed(2)} kg</p>
            </div>
            {[["Electricity", m.electricity_co2], ["Water", m.water_co2], ["Gas", m.gas_co2], ["Fuel", m.fuel_co2]].map(([k, v]) => (
              <div key={k} className="hist-row">
                <span className="hist-dot" style={{ background: COLORS[k] }} />
                <span className="hist-key">{k}</span>
                <div className="hist-row-bar-track">
                  <div
                    className="hist-row-bar-fill"
                    style={{ width: `${Math.min(100, ((+v||0) / Math.max(+m.total_co2||1, 0.01)) * 100)}%`, background: COLORS[k] }}
                  />
                </div>
                <span className="hist-val">{(+v || 0).toFixed(2)} kg</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
