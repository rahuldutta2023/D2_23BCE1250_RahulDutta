import { useState, useEffect } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid, Legend,
} from "recharts";
import "./Predictions.css";

const API = "http://localhost:8000/api";

function apiFetch(path) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

const TREND_CONFIG = {
  increasing: { icon: "📈", label: "Increasing",  color: "#ef4444", bg: "#fef2f2" },
  decreasing: { icon: "📉", label: "Decreasing",  color: "#22c55e", bg: "#f0fdf4" },
  stable:     { icon: "➡️", label: "Stable",      color: "#f59e0b", bg: "#fffbeb" },
  insufficient_data: { icon: "📊", label: "Not enough data", color: "#6b7280", bg: "#f9fafb" },
};

const RESOURCE_LABELS = { electricity: "Electricity ⚡", gas: "Gas 🔥", fuel: "Fuel 🚗", water: "Water 💧" };
const RESOURCE_COLORS = { electricity: "#f59e0b", gas:  "#ef4444", fuel: "#8b5cf6", water: "#3b82f6" };

export default function Predictions({ darkMode }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/predictions/")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={`pred-page${darkMode ? " dark" : ""}`}><div className="c-loading">🔮 Crunching predictions…</div></div>;
  if (!data)   return <div className={`pred-page${darkMode ? " dark" : ""}`}><div className="c-loading">Failed to load predictions.</div></div>;

  const trendCfg = TREND_CONFIG[data.trend] || TREND_CONFIG.stable;

  // Build chart data — history + predicted point
  const chartData = (data.history || []).map(h => ({
    period:    h.period,
    actual:    +(+h.total_co2).toFixed(2),
    predicted: null,
    isPred:    false,
  }));

  if (data.predicted_co2 !== null) {
    chartData.push({
      period:    data.next_period,
      actual:    null,
      predicted: data.predicted_co2,
      isPred:    true,
    });
  }

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload.isPred) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#c8ff00" stroke="#111" strokeWidth={2} />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={10} fill="#666">predicted</text>
      </g>
    );
  };

  const confidence = { high: "🟢 High", medium: "🟡 Medium", low: "🔴 Low" }[data.confidence] || "—";

  return (
    <div className={`pred-page${darkMode ? " dark" : ""}`}>
      <div className="pred-inner">
        <h1 className="pred-title">🔮 Emission Predictions</h1>
        <p className="pred-sub">Linear regression on your monthly data</p>

        {/* Main prediction card */}
        <div className="pred-hero" style={{ borderColor: trendCfg.color }}>
          <div className="pred-hero-left">
            <p className="pred-hero-label">Predicted for {data.next_period}</p>
            <p className="pred-hero-value">
              {data.predicted_co2 !== null ? `${data.predicted_co2} kg` : "—"}
            </p>
            <p className="pred-hero-msg">{data.message}</p>
          </div>
          <div className="pred-hero-right">
            <div className="pred-trend-badge" style={{ background: trendCfg.bg, color: trendCfg.color }}>
              <span style={{ fontSize: "1.5rem" }}>{trendCfg.icon}</span>
              <span>{trendCfg.label}</span>
              {data.pct_change !== 0 && (
                <span className="pred-pct">{data.pct_change > 0 ? "+" : ""}{data.pct_change}%</span>
              )}
            </div>
            <p className="pred-confidence">Confidence: {confidence}</p>
            {data.weekly_avg !== null && (
              <p className="pred-weekly">Weekly avg this month: <strong>{data.weekly_avg} kg</strong></p>
            )}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="pred-chart-card">
            <p className="pred-section-title">Historical + Predicted Trend</p>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2a2a2a" : "#f0f0f0"} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: darkMode ? "#666" : "#999" }} />
                <YAxis tick={{ fontSize: 11, fill: darkMode ? "#666" : "#999" }} unit=" kg" />
                <Tooltip
                  formatter={(v, name) => [`${v} kg`, name === "actual" ? "Actual CO₂" : "Predicted CO₂"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e0", fontSize: 12 }}
                />
                <Legend formatter={v => v === "actual" ? "Actual CO₂" : "Predicted CO₂"} />
                <Bar dataKey="actual" fill={darkMode ? "#333" : "#e5e5e0"} radius={[4, 4, 0, 0]} name="actual" />
                <Line
                  type="monotone" dataKey="predicted" stroke="#c8ff00"
                  strokeWidth={2} strokeDasharray="6 3"
                  dot={<CustomDot />} name="predicted"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-resource predictions */}
        {data.resource_predictions && Object.keys(data.resource_predictions).length > 0 && (
          <div className="pred-resources">
            <p className="pred-section-title">Resource-wise Forecast</p>
            <div className="pred-resource-grid">
              {Object.entries(data.resource_predictions).map(([key, info]) => (
                <div key={key} className="pred-resource-card" style={{ borderLeft: `3px solid ${RESOURCE_COLORS[key] || "#ccc"}` }}>
                  <p className="pred-resource-label">{RESOURCE_LABELS[key] || key}</p>
                  <p className="pred-resource-value">{info.predicted} kg</p>
                  <p className="pred-resource-trend" style={{ color: info.trend === "up" ? "#ef4444" : info.trend === "down" ? "#22c55e" : "#f59e0b" }}>
                    {info.trend === "up" ? "↑ Rising" : info.trend === "down" ? "↓ Falling" : "→ Stable"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.trend === "insufficient_data" && (
          <div className="pred-empty">
            <p>📊 Log consumption data for at least 2 months to unlock predictions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
