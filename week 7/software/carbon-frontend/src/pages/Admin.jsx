import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "./Admin.css";

const API = "http://localhost:8000/api";
function apiFetch(path) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

const COLORS = ["#c8ff00", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function Admin() {
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [tab,     setTab]     = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/admin/stats").then(r => { if (!r.ok) throw new Error("Forbidden"); return r.json(); }),
      apiFetch("/admin/users").then(r => r.json()),
    ])
      .then(([s, u]) => { setStats(s); setUsers(Array.isArray(u) ? u : []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="admin-page"><div className="c-loading">⚙️ Loading admin panel…</div></div>;

  if (error) return (
    <div className="admin-page">
      <div className="admin-inner">
        <div className="admin-error">
          <p style={{ fontSize: "2rem" }}>🔒</p>
          <p>Admin access required</p>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: "0.3rem" }}>
            Ask a current admin to grant you admin role.
          </p>
        </div>
      </div>
    </div>
  );

  const monthlyData = (stats.monthly_system_trend || []).map(m => ({
    period: m.period,
    co2: +(+m.total_co2).toFixed(1),
  }));

  const resourceData = (stats.resource_breakdown || []).map(r => ({
    name: r.resource_type,
    co2:  +(+r.total_co2).toFixed(1),
  }));

  const statTiles = [
    { label: "Total Users",          value: stats.total_users,           icon: "👥" },
    { label: "Total CO₂ Tracked",    value: `${stats.total_co2_kg} kg`,  icon: "💨" },
    { label: "Avg CO₂ / User",       value: `${stats.avg_co2_per_user_kg} kg`, icon: "📊" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <h1 className="admin-title">⚙️ Admin Dashboard</h1>
        <p className="admin-sub">System-wide analytics and user management</p>

        {/* Stat tiles */}
        <div className="admin-stat-grid">
          {statTiles.map(t => (
            <div key={t.label} className="admin-stat-tile">
              <span className="admin-stat-icon">{t.icon}</span>
              <div>
                <p className="admin-stat-label">{t.label}</p>
                <p className="admin-stat-value">{t.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {["overview", "users", "emissions"].map(t => (
            <button
              key={t}
              className={`admin-tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "overview" && (
          <div className="admin-tab-content">
            {monthlyData.length > 0 && (
              <div className="admin-chart-card">
                <p className="admin-section-title">System-wide Monthly CO₂ (kg)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} unit=" kg" />
                    <Tooltip formatter={v => [`${v} kg`, "Total CO₂"]} contentStyle={{ borderRadius: 12, fontSize: 12, background: "rgba(14,40,18,0.92)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                    <Bar dataKey="co2" radius={[6, 6, 0, 0]}>
                      {monthlyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {resourceData.length > 0 && (
              <div className="admin-chart-card">
                <p className="admin-section-title">CO₂ by Resource Type</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={resourceData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} unit=" kg" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }} width={80} />
                    <Tooltip formatter={v => [`${v} kg`, "CO₂"]} contentStyle={{ borderRadius: 12, fontSize: 12, background: "rgba(14,40,18,0.92)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                    <Bar dataKey="co2" radius={[0, 6, 6, 0]}>
                      {resourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top emitters */}
            {stats.top_emitters?.length > 0 && (
              <div className="admin-chart-card">
                <p className="admin-section-title">Top Emitters</p>
                {stats.top_emitters.map((u, i) => (
                  <div key={u.user_id} className="admin-emitter-row">
                    <span className="admin-emitter-rank">#{i + 1}</span>
                    <span className="admin-emitter-name">{u.name}</span>
                    <span className="admin-emitter-city">{u.city}</span>
                    <span className="admin-emitter-co2">{u.total_co2} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users tab */}
        {tab === "users" && (
          <div className="admin-tab-content">
            <div className="admin-chart-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Email</th><th>City</th>
                      <th>Household</th><th>Role</th><th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.user_id}>
                        <td>{u.user_id}</td>
                        <td><strong>{u.full_name}</strong></td>
                        <td style={{ color: "#999", fontSize: "0.78rem" }}>{u.email}</td>
                        <td>{u.city || "—"}</td>
                        <td style={{ textAlign: "center" }}>{u.household_size}</td>
                        <td>
                          <span className={`admin-role-badge ${u.role}`}>{u.role}</span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {(+u.eco_points || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Emissions tab */}
        {tab === "emissions" && (
          <div className="admin-tab-content">
            <div className="admin-chart-card">
              <p className="admin-section-title">Summary Statistics</p>
              <div className="admin-emission-stats">
                <div className="admin-e-stat"><p className="lbl">Total CO₂ Logged</p><p className="val">{stats.total_co2_kg} kg</p></div>
                <div className="admin-e-stat"><p className="lbl">Total Users</p><p className="val">{stats.total_users}</p></div>
                <div className="admin-e-stat"><p className="lbl">Average per User</p><p className="val">{stats.avg_co2_per_user_kg} kg</p></div>
                <div className="admin-e-stat"><p className="lbl">Months Tracked</p><p className="val">{monthlyData.length}</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
