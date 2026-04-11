import { useLang } from "../i18n";
import './components.css';

export default function SocialProofCard({ data }) {
  const { t } = useLang();
  if (!data) return null;
  const { peer_avg_co2, user_percentile, vs_avg_kg, message, city, peer_count, household_bucket } = data;
  const better  = vs_avg_kg <= 0;
  const userCo2 = peer_avg_co2 + vs_avg_kg;
  const maxVal  = Math.max(peer_avg_co2, userCo2) * 1.1;

  return (
    <div className="c-card">
      <p className="c-card-title">👥 {t("vsPeers")}</p>

      <div className={`proof-banner ${better ? "good" : "bad"}`}>{message}</div>
      <p className="proof-meta">
        {peer_count} {t("households")} · {city} · {household_bucket} {t("members")}
      </p>

      {/* City average bar */}
      <div style={{ marginBottom: "0.9rem" }}>
        <div className="cmp-label-row">
          <span>{t("cityAvg")}</span>
          <span>{peer_avg_co2.toFixed(1)} kg CO₂</span>
        </div>
        <div className="cmp-bar-track">
          <div
            className="cmp-bar cmp-bar-gray"
            style={{ width: `${(peer_avg_co2 / maxVal) * 100}%` }}
          />
        </div>
      </div>

      {/* User bar */}
      <div style={{ marginBottom: "0.2rem" }}>
        <div className="cmp-label-row">
          <span>{t("you")}</span>
          <span>{userCo2.toFixed(1)} kg CO₂</span>
        </div>
        <div className="cmp-bar-track">
          <div
            className={`cmp-bar ${better ? "cmp-bar-green" : "cmp-bar-red"}`}
            style={{ width: `${(userCo2 / maxVal) * 100}%` }}
          />
        </div>
      </div>

      <p className="proof-percentile">
        {t("emitLess")} <strong>{user_percentile}%</strong> {t("ofPeers")}
      </p>
    </div>
  );
}
