import { useState, useEffect } from "react";
import { useLang } from "../i18n";
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
  critical: { icon: "🚨", bg: "rgba(239,68,68,0.15)",  border: "#fecaca", color: "#ef4444" },
  warning:  { icon: "⚠️",  bg: "rgba(245,158,11,0.15)", border: "#fde68a", color: "#f59e0b" },
  success:  { icon: "🎉", bg: "rgba(168,213,94,0.18)", border: "#a8d55e", color: "#a8d55e" },
  info:     { icon: "ℹ️",  bg: "rgba(59,130,246,0.15)", border: "#bfdbfe", color: "#60a5fa" },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { t } = useLang();
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

  const displayed   = filter === "unread" ? notifs.filter(n => !n.is_read) : notifs;
  const unreadCount = notifs.filter(n => !n.is_read).length;

  if (loading) return (
    <div className="notif-page">
      <div className="c-loading">🔔 {t("notifications")}…</div>
    </div>
  );

  return (
    <div className="notif-page">
      <div className="notif-inner">
        <div className="notif-header">
          <div>
            <h1 className="notif-title">🔔 {t("notifications")}</h1>
            <p className="notif-sub">{unreadCount > 0 ? `${unreadCount} ${t("unread")}` : t("allCaughtUp")}</p>
          </div>
          {unreadCount > 0 && (
            <button id="notif-mark-all" className="notif-mark-all" onClick={markAllRead}>{t("markAllRead")}</button>
          )}
        </div>

        <div className="notif-filters">
          {["all", "unread"].map(f => (
            <button
              key={f}
              id={`notif-filter-${f}`}
              className={`notif-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? `${t("all")} (${notifs.length})` : `${t("unread")} (${unreadCount})`}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className="notif-empty">
            <p style={{ fontSize: "2.5rem" }}>🎉</p>
            <p style={{ fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
              {filter === "unread" ? `${t("unread")} — 0` : t("noNotifs")}
            </p>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>
              {t("notifsWillAppear")}
            </p>
          </div>
        ) : (
          <div className="notif-list">
            {displayed.map(n => {
              const cfg = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.info;
              return (
                <div
                  key={n.notification_id}
                  id={`notif-${n.notification_id}`}
                  className={`notif-item${n.is_read ? " read" : ""}`}
                  style={{ borderLeft: `3px solid ${cfg.border}` }}
                  onClick={() => !n.is_read && markRead(n.notification_id)}
                >
                  <div className="notif-item-icon" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>
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
