import { useState } from "react";
import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Dashboard    from "./Dashboard";
import Leaderboard  from "./pages/Leaderboard";
import History      from "./pages/History";
import Predictions  from "./pages/Predictions";
import Notifications from "./pages/Notifications";
import Admin        from "./pages/Admin";
import './Dashboard.css';

export default function App() {
  const [page,     setPage]     = useState(localStorage.getItem("token") ? "dashboard" : "login");
  const [darkMode, setDarkMode] = useState(false);

  const handleLogin    = () => setPage("dashboard");
  const handleRegister = () => setPage("login");
  const handleLogout   = () => { localStorage.clear(); setPage("login"); };

  if (page === "login")    return <Login onLogin={handleLogin} onRegister={() => setPage("register")} />;
  if (page === "register") return <Register onRegister={handleRegister} onLogin={() => setPage("login")} />;

  const isAdmin = localStorage.getItem("role") === "admin";

  const tabs = [
    { id: "dashboard",     label: "Home",          icon: "🏠" },
    { id: "history",       label: "History",       icon: "📈" },
    { id: "predictions",   label: "Predict",       icon: "🔮" },
    { id: "leaderboard",   label: "Ranks",         icon: "🏅" },
    { id: "notifications", label: "Alerts",        icon: "🔔" },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <div className={darkMode ? "global-dark" : ""}>
      {page === "dashboard"     && <Dashboard    onNavigate={setPage} darkMode={darkMode} setDarkMode={setDarkMode} />}
      {page === "history"       && <History      darkMode={darkMode} />}
      {page === "predictions"   && <Predictions  darkMode={darkMode} />}
      {page === "leaderboard"   && <Leaderboard  darkMode={darkMode} />}
      {page === "notifications" && <Notifications darkMode={darkMode} />}
      {page === "admin"         && <Admin        darkMode={darkMode} />}

      <nav className={`c-bottom-nav${darkMode ? " dark" : ""}`}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setPage(t.id)}
            className={`c-nav-item ${page === t.id ? "active" : ""}`}
          >
            <span className="c-nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
        <button onClick={handleLogout} className="c-nav-item">
          <span className="c-nav-icon">🚪</span>
          Logout
        </button>
      </nav>
    </div>
  );
}
