import { useState } from "react";
import { useLang } from "../i18n";
import './components.css';

const CATEGORY_ICONS = {
  Energy: "⚡", Water: "💧", Waste: "♻️",
  Transport: "🚌", Nature: "🌳", Food: "🥦", Digital: "💻",
};

export default function ActionsCard({ completed = [], pending = [], onComplete }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(null);
  const [toast,   setToast]   = useState(null);

  const handleComplete = async (action) => {
    setLoading(action.action_id);
    const data = await onComplete(action.action_id);
    setLoading(null);
    setToast(data?.message || `+${action.points} ${t("ptsEarned")}`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="c-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="c-card-title" style={{ margin: 0 }}>🏆 {t("ecoChecklist")}</p>
        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
          {completed.length} {t("completed")}
        </span>
      </div>

      {toast && <div className="toast" style={{ marginTop: "0.85rem" }}>{toast}</div>}

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ marginTop: "0.85rem", marginBottom: "0.5rem" }}>
          <p className="action-section-label">{t("completed")}</p>
          {completed.map(a => (
            <div key={a.action_id} className="done-item">
              <span style={{ fontSize: "0.85rem" }}>✅</span>
              <span className="done-name">{a.title}</span>
              <span className="done-pts">+{a.points} pts</span>
            </div>
          ))}
        </div>
      )}

      {/* Pending */}
      <p className="action-section-label" style={{ marginTop: "0.85rem" }}>{t("availableActions")}</p>
      <div className="action-scroll" style={{ maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
        {pending.map(a => (
          <div key={a.action_id} className="action-item">
            <div className="action-cat-icon">{CATEGORY_ICONS[a.category] || "🌿"}</div>
            <span className="action-name">{a.title}</span>
            <span className="action-pts">+{a.points} pts</span>
            <button
              id={`btn-complete-${a.action_id}`}
              className="btn-done"
              onClick={() => handleComplete(a)}
              disabled={loading === a.action_id}
            >
              {loading === a.action_id ? "…" : t("markDone")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
