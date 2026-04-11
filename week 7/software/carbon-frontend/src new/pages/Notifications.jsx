import { useState, useEffect } from "react";
import "./Notifications.css";

const API = "http://localhost:8000/api";

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
}

const SEVERITY_CONFIG = {
  critical: { icon: "🚨", bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
  warning:  { icon: "⚠️",  bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
  success:  { icon: "🎉", bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a" },
  info:     { icon: "ℹ️",  bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb" },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications({ darkMode }) {
  const [notifs,  setNotifs]  = useState([]);
  const [filter,  setFilter]  = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiFetch("/notifications/")
      .then(r => r.json())
      .then(d => { setNotifs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await apiFetch("/notifications/read-all", { method: "POST" });
    load();
  };

  const markRead = async (id) => {
    await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
  };

  const displayed = filter === "unread" ? notifs.filter(n => !n.is_read) : notifs;
  const unreadCount = notifs.filter(n => !n.is_read).length;

  if (loading) return (
    <div className={`notif-page${darkMode ? " dark" : ""}`}>
      <div className="c-loading">🔔 Loading notifications…</div>
    </div>
  );

  return (
    <div className={`notif-page${darkMode ? " dark" : ""}`}>
      <div className="notif-inner">
        <div className="notif-header">
          <div>
            <h1 className="notif-title">🔔 Notifications</h1>
            <p className="notif-sub">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</p>
          </div>
          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
          )}
        </div>

        <div className="notif-filters">
          {["all", "unread"].map(f => (
            <button
              key={f}
              className={`notif-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? `All (${notifs.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className="notif-empty">
            <p style={{ fontSize: "2rem" }}>🎉</p>
            <p>{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
            <p style={{ fontSize: "0.78rem", marginTop: "0.3rem", color: "#bbb" }}>
              Alerts will appear here when you log consumption data
            </p>
          </div>
        ) : (
          <div className="notif-list">
            {displayed.map(n => {
              const cfg = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.info;
              return (
                <div
                  key={n.notification_id}
                  className={`notif-item${n.is_read ? " read" : ""}`}
                  style={{ borderLeft: `3px solid ${cfg.border}` }}
                  onClick={() => !n.is_read && markRead(n.notification_id)}
                >
                  <div className="notif-item-icon" style={{ background: cfg.bg }}>{cfg.icon}</div>
                  <div className="notif-item-body">
                    <div className="notif-item-header">
                      <p className="notif-item-title">{n.title}</p>
                      <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="notif-item-msg">{n.message}</p>
                    <span className="notif-severity-tag" style={{ background: cfg.bg, color: cfg.color }}>
                      {n.severity}
                    </span>
                  </div>
                  {!n.is_read && <div className="notif-unread-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
