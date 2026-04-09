import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import './components.css';

const COLORS = ["#c8ff00", "#9acc00", "#111111", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6"];

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
              className={`chart-btn${chartType === t ? " active" : ""}`}
              onClick={() => setChartType(t)}
            >
              {t === "bar" ? "📊 Bar" : "🥧 Pie"}
            </button>
          ))}
        </div>
      </div>

      {chartType === "bar" ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={breakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="resource" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" kg" />
            <Tooltip formatter={v => [`${v} kg`, "CO₂"]} />
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
            <Legend />
            <Tooltip formatter={v => [`${v} kg`, "CO₂"]} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
