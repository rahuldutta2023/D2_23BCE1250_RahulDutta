import { useLang } from "../i18n";
import './components.css';

const TREND_ICON  = { increasing: "📈", decreasing: "📉", stable: "➡️", insufficient_data: "📊" };
const TREND_COLOR = { increasing: "#ef4444", decreasing: "#a8d55e", stable: "#f59e0b", insufficient_data: "rgba(255,255,255,0.4)" };

export default function PredictionCard({ prediction }) {
  const { t } = useLang();
  if (!prediction) return null;

  const icon  = TREND_ICON[prediction.trend]  || "📊";
  const color = TREND_COLOR[prediction.trend] || TREND_COLOR.insufficient_data;

  return (
    <div className="c-card">
      <p className="c-card-title">{t("prediction")}</p>
      <div className="pred-card-top">
        <span style={{ fontSize: "1.8rem" }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p className="pred-card-period">{prediction.next_period}</p>
          <p className="pred-card-value" style={{ color }}>
            {prediction.predicted_co2 !== null ? `${prediction.predicted_co2.toFixed(1)} kg` : "—"}
          </p>
        </div>
      </div>

      {prediction.pct_change !== 0 && prediction.predicted_co2 !== null && (
        <div className="pred-card-badge" style={{ background: color + "22", color, border: `1px solid ${color}33` }}>
          {prediction.pct_change > 0 ? "+" : ""}{prediction.pct_change}% {t("vsLastMonth")}
        </div>
      )}

      <p className="pred-card-msg" style={{ minHeight: "2.8rem" }}>{prediction.message}</p>

      {prediction.confidence && prediction.confidence !== "insufficient_data" && (
        <p className="pred-card-conf">
          {t("confidence")}: <strong style={{ color: "rgba(255,255,255,0.6)" }}>{prediction.confidence}</strong>
        </p>
      )}
    </div>
  );
}
