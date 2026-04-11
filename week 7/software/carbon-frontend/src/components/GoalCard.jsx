import { useState } from "react";
import './components.css';

function StatusBadge({ status }) {
  const map = {
    ON_TRACK: { cls: "badge-on-track", label: "On Track ✅" },
    WARNING:  { cls: "badge-warning",  label: "Warning ⚠️" },
    EXCEEDED: { cls: "badge-exceeded", label: "Exceeded 🚨" },
  };
  const s = map[status] || map.ON_TRACK;
  return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
}

export default function GoalCard({ goal, onSetGoal }) {
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!budget) return;
    setSaving(true);
    await onSetGoal(parseFloat(budget));
    setSaving(false);
    setBudget("");
  };

  if (!goal) return (
    <div className="c-card">
      <p className="c-card-title">🎯 Set Carbon Budget</p>
      <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "0.85rem" }}>
        Set a monthly CO₂ target and get real-time alerts.
      </p>
      <div className="goal-input-row">
        <input
          className="goal-input"
          type="number"
          placeholder="e.g. 200 kg"
          value={budget}
          onChange={e => setBudget(e.target.value)}
        />
        <button
          className="btn-set-goal"
          onClick={handleSave}
          disabled={saving || !budget}
        >
          {saving ? "…" : "Set Goal"}
        </button>
      </div>
    </div>
  );

  const pct      = Math.min((goal.current_co2_kg / goal.monthly_budget_kg) * 100, 100);
  const fillCls  = goal.status === "EXCEEDED" ? "prog-red"
                 : goal.status === "WARNING"  ? "prog-yellow"
                 : "prog-green";

  return (
    <div className="c-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.7rem" }}>
        <p className="c-card-title" style={{ margin: 0 }}>🎯 Carbon Budget</p>
        <StatusBadge status={goal.status} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#999", marginBottom: "0.25rem" }}>
        <span>{goal.current_co2_kg} kg used</span>
        <span>{goal.monthly_budget_kg} kg budget</span>
      </div>

      <div className="prog-track">
        <div className={`prog-fill ${fillCls}`} style={{ width: `${pct}%` }} />
      </div>

      <p style={{ fontSize: "0.78rem", color: "#555", fontWeight: 600, marginBottom: "0.3rem" }}>
        {goal.alert_message}
      </p>
      <p style={{ fontSize: "0.72rem", color: "#aaa" }}>
        Projected: <strong style={{ color: "#555" }}>{goal.projected_co2_kg} kg</strong> · {goal.days_remaining} days remaining
      </p>
    </div>
  );
}
