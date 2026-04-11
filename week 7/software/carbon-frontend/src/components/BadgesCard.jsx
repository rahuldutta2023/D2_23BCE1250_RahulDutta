import { useLang } from "../i18n";
import './components.css';

export default function BadgesCard({ badges = [] }) {
  const { lang, t } = useLang();
  const earned = badges.filter(b => b.earned);

  return (
    <div className="c-card grid-col-2">
      <div className="badges-header">
        <p className="c-card-title">{t("achievements")}</p>
        <span className="badges-count">{earned.length}/{badges.length} {t("earned")}</span>
      </div>

      <div className="badges-grid">
        {badges.map(b => (
          <div
            key={b.badge_id}
            id={`badge-${b.badge_id}`}
            className={`badge-item${b.earned ? " earned" : " locked"}`}
            title={b.description}
            style={b.earned ? { borderColor: b.color + "44" } : {}}
          >
            <div className="badge-emoji" style={b.earned ? { background: b.color + "22", boxShadow: `0 0 12px ${b.color}22` } : {}}>
              {b.earned ? b.emoji : "🔒"}
            </div>
            <p className="badge-name">{b.name}</p>
            {b.earned && b.awarded_at && (
              <p className="badge-date">
                {new Date(b.awarded_at).toLocaleDateString(lang === "en" ? "en-GB" : lang, { 
                  day: "numeric", 
                  month: "short" 
                })}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
