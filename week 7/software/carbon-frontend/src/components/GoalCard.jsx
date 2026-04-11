import { useState } from "react";
import { useLang } from "../i18n";
import './components.css';

function StatusBadge({ status, t }) {
  const map = {
    ON_TRACK: { cls: "badge-on-track", label: t("onTrack") + " ✅" },
    WARNING:  { cls: "badge-warning",  label: t("warning") + " ⚠️" },
    EXCEEDED: { cls: "badge-exceeded", label: t("exceeded") + " 🚨" },
  };
  const s = map[status] || map.ON_TRACK;
  return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
}

export default function GoalCard({ goal, onSetGoal }) {
  const { t } = useLang();
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
      <p className="c-card-title">🎯 {t("setCarbonBudget")}</p>
      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.85rem", lineHeight: "1.4" }}>
        {t("setBudgetDesc")}
      </p>
      <div className="goal-input-row">
        <input
          id="set-budget-input"
          className="goal-input"
          type="number"
          placeholder="e.g. 200 kg"
          value={budget}
          onChange={e => setBudget(e.target.value)}
        />
        <button
          id="btn-set-budget"
          className="btn-set-goal"
          onClick={handleSave}
          disabled={saving || !budget}
        >
          {saving ? "…" : t("setGoal")}
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
        <p className="c-card-title" style={{ margin: 0 }}>🎯 {t("carbonBudget")}</p>
        <StatusBadge status={goal.status} t={t} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.35rem", fontWeight: 600 }}>
        <span>{goal.current_co2_kg.toFixed(1)} kg {t("used")}</span>
        <span>{goal.monthly_budget_kg} kg {t("budget")}</span>
      </div>

      <div className="prog-track">
        <div className={`prog-fill ${fillCls}`} style={{ width: `${pct}%` }} />
      </div>

      <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, margin: "0.6rem 0 0.4rem", lineHeight: "1.4" }}>
        {goal.alert_message}
      </p>
      <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
        {t("projected")}: <strong style={{ color: "rgba(255,255,255,0.6)" }}>{goal.projected_co2_kg.toFixed(1)} kg</strong> · {goal.days_remaining} {t("daysRemaining")}
      </p>
    </div>
  );
}
