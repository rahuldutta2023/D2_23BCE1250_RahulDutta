import { useState, useEffect } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { useLang } from "../i18n";
import "./Predictions.css";

const API = "http://localhost:8000/api";

function apiFetch(path) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

const TREND_CONFIG = {
  increasing:        { icon: "📈", label: "Increasing",     color: "#ef4444", bg: "rgba(239,68,68,0.18)" },
  decreasing:        { icon: "📉", label: "Decreasing",     color: "#a8d55e", bg: "rgba(168,213,94,0.18)" },
  stable:            { icon: "➡️", label: "Stable",         color: "#f59e0b", bg: "rgba(245,158,11,0.18)" },
  insufficient_data: { icon: "📊", label: "Not enough data", color: "#9ca3af", bg: "rgba(156,163,175,0.15)" },
};

const RESOURCE_LABELS = { electricity: "Electricity ⚡", gas: "Gas 🔥", fuel: "Fuel 🚗", water: "Water 💧" };
const RESOURCE_COLORS = { electricity: "#f59e0b", gas: "#ef4444", fuel: "#8b5cf6", water: "#3b82f6" };

export default function Predictions() {
  const { t } = useLang();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/predictions/")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="pred-page"><div className="c-loading">🔮 {t("emissionPredictions")}…</div></div>;
  if (!data)   return <div className="pred-page"><div className="c-loading">Failed to load predictions.</div></div>;

  const trendCfg = TREND_CONFIG[data.trend] || TREND_CONFIG.stable;

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
        <circle cx={cx} cy={cy} r={9} fill="var(--accent)" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
        <text x={cx} y={cy - 16} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.65)">predicted</text>
      </g>
    );
  };

  const confidence = { high: "🟢 High", medium: "🟡 Medium", low: "🔴 Low" }[data.confidence] || "—";

  return (
    <div className="pred-page">
      <div className="pred-inner">
        <h1 className="pred-title">🔮 {t("emissionPredictions")}</h1>
        <p className="pred-sub">{t("predSubtitle")}</p>

        {/* Hero card */}
        <div className="pred-hero" style={{ borderColor: trendCfg.color + "55" }}>
          <div className="pred-hero-left">
            <p className="pred-hero-label">{t("predictedFor")} {data.next_period}</p>
            <p className="pred-hero-value">
              {data.predicted_co2 !== null ? `${data.predicted_co2} kg` : "—"}
            </p>
            <p className="pred-hero-msg">{data.message}</p>
          </div>
          <div className="pred-hero-right">
            <div className="pred-trend-badge" style={{ background: trendCfg.bg, color: trendCfg.color }}>
              <span style={{ fontSize: "1.4rem" }}>{trendCfg.icon}</span>
              <span>{trendCfg.label}</span>
              {data.pct_change !== 0 && (
                <span className="pred-pct">{data.pct_change > 0 ? "+" : ""}{data.pct_change}%</span>
              )}
            </div>
            <p className="pred-confidence">{t("confidence")}: {confidence}</p>
            {data.weekly_avg !== null && (
              <p className="pred-weekly">{t("weeklyAvg")}: <strong>{data.weekly_avg} kg</strong></p>
            )}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="pred-chart-card">
            <p className="pred-section-title">{t("historicalTrend")}</p>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} />
                <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} unit=" kg" />
                <Tooltip
                  formatter={(v, name) => [`${v} kg`, name === "actual" ? "Actual CO₂" : "Predicted CO₂"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(14,40,18,0.92)",
                    fontSize: 12,
                    color: "#fff",
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Legend
                  formatter={v => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v === "actual" ? "Actual CO₂" : "Predicted CO₂"}</span>}
                />
                <Bar dataKey="actual" fill="rgba(74,156,47,0.45)" radius={[5, 5, 0, 0]} name="actual" />
                <Line
                  type="monotone" dataKey="predicted" stroke="var(--accent)"
                  strokeWidth={2.5} strokeDasharray="6 3"
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
            <p className="pred-section-title">{t("resourceForecast")}</p>
            <div className="pred-resource-grid">
              {Object.entries(data.resource_predictions).map(([key, info]) => (
                <div key={key} className="pred-resource-card" style={{ borderLeft: `3px solid ${RESOURCE_COLORS[key] || "#ccc"}` }}>
                  <p className="pred-resource-label">{RESOURCE_LABELS[key] || key}</p>
                  <p className="pred-resource-value">{info.predicted} kg</p>
                  <p className="pred-resource-trend" style={{ color: info.trend === "up" ? "#ef4444" : info.trend === "down" ? "#a8d55e" : "#f59e0b" }}>
                    {info.trend === "up" ? "↑ Rising" : info.trend === "down" ? "↓ Falling" : "→ Stable"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.trend === "insufficient_data" && (
          <div className="pred-empty">
            📊 {t("notEnoughData")}
          </div>
        )}
      </div>
    </div>
  );
}
