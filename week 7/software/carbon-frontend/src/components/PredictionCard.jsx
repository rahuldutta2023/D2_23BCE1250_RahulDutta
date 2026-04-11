import './components.css';

const TREND_ICON = { increasing: "📈", decreasing: "📉", stable: "➡️", insufficient_data: "📊" };
const TREND_COLOR = { increasing: "#ef4444", decreasing: "#22c55e", stable: "#f59e0b", insufficient_data: "#9ca3af" };

export default function PredictionCard({ prediction }) {
  if (!prediction) return null;

  const icon  = TREND_ICON[prediction.trend]  || "📊";
  const color = TREND_COLOR[prediction.trend] || "#9ca3af";

  return (
    <div className="c-card">
      <p className="c-card-title">Prediction</p>
      <div className="pred-card-top">
        <span style={{ fontSize: "1.6rem" }}>{icon}</span>
        <div>
          <p className="pred-card-period">{prediction.next_period}</p>
          <p className="pred-card-value" style={{ color }}>
            {prediction.predicted_co2 !== null ? `${prediction.predicted_co2} kg` : "—"}
          </p>
        </div>
      </div>

      {prediction.pct_change !== 0 && prediction.predicted_co2 !== null && (
        <div className="pred-card-badge" style={{ background: color + "18", color }}>
          {prediction.pct_change > 0 ? "+" : ""}{prediction.pct_change}% vs last month
        </div>
      )}

      <p className="pred-card-msg">{prediction.message}</p>

      {prediction.confidence && prediction.confidence !== "insufficient_data" && (
        <p className="pred-card-conf">
          Confidence: <strong>{prediction.confidence}</strong>
        </p>
      )}
    </div>
  );
}
