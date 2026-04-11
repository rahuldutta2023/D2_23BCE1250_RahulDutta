import './components.css';

export default function BadgesCard({ badges = [] }) {
  const earned   = badges.filter(b => b.earned);
  const unearned = badges.filter(b => !b.earned);

  return (
    <div className="c-card grid-col-2">
      <div className="badges-header">
        <p className="c-card-title">Achievements</p>
        <span className="badges-count">{earned.length}/{badges.length} earned</span>
      </div>

      <div className="badges-grid">
        {badges.map(b => (
          <div
            key={b.badge_id}
            className={`badge-item${b.earned ? " earned" : " locked"}`}
            title={b.description}
            style={b.earned ? { borderColor: b.color } : {}}
          >
            <div className="badge-emoji" style={b.earned ? { background: b.color + "22" } : {}}>
              {b.earned ? b.emoji : "🔒"}
            </div>
            <p className="badge-name">{b.name}</p>
            {b.earned && b.awarded_at && (
              <p className="badge-date">{new Date(b.awarded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
