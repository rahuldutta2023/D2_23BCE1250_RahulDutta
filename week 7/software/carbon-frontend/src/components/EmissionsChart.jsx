import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import './components.css';

const COLORS = ["#c8ff00", "#a8d55e", "#4a9c2f", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

const tooltipStyle = {
  borderRadius: 12,
  fontSize: 12,
  background: "rgba(14,40,18,0.92)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff",
  backdropFilter: "blur(12px)",
};

export default function EmissionsChart({ breakdown = [] }) {
  const [chartType, setChartType] = useState("bar");

  return (
    <div className="c-card grid-col-2">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <p className="c-card-title">Emissions Breakdown</p>
        <div className="chart-btns">
          {["bar", "pie"].map(t => (
            <button
              key={t}
              id={`chart-type-${t}`}
              className={`chart-btn${chartType === t ? " active" : ""}`}
              onClick={() => setChartType(t)}
            >
              {t === "bar" ? "📊 Bar" : "🥧 Pie"}
            </button>
          ))}
        </div>
      </div>

      {breakdown.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
          No emission data yet
        </div>
      ) : chartType === "bar" ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={breakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="resource" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} />
            <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} unit=" kg" />
            <Tooltip formatter={v => [`${v} kg`, "CO₂"]} contentStyle={tooltipStyle} />
            <Bar dataKey="co2_kg" radius={[6, 6, 0, 0]}>
              {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={breakdown}
              dataKey="co2_kg"
              nameKey="resource"
              cx="50%" cy="50%"
              outerRadius={85}
              label={({ resource, percent }) => `${resource} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Legend formatter={v => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{v}</span>} />
            <Tooltip formatter={v => [`${v} kg`, "CO₂"]} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
