import { useState } from "react";
import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Dashboard    from "./Dashboard";
import Leaderboard  from "./pages/Leaderboard";
import History      from "./pages/History";
import Predictions  from "./pages/Predictions";
import Notifications from "./pages/Notifications";
import Admin        from "./pages/Admin";
import { useLang, LANGUAGES } from "./i18n";
import './Dashboard.css';

export default function App() {
  const [page, setPage] = useState(localStorage.getItem("token") ? "dashboard" : "login");
  const { lang, changeLang, t } = useLang();

  const handleLogin    = () => setPage("dashboard");
  const handleRegister = () => setPage("login");
  const handleLogout   = () => { localStorage.clear(); setPage("login"); };

  if (page === "login")    return <Login onLogin={handleLogin} onRegister={() => setPage("register")} />;
  if (page === "register") return <Register onRegister={handleRegister} onLogin={() => setPage("login")} />;

  const isAdmin = localStorage.getItem("role") === "admin";

  const tabs = [
    { id: "dashboard",     label: t("home"),    icon: "🏠" },
    { id: "history",       label: t("history"), icon: "📈" },
    { id: "predictions",   label: t("predict"), icon: "🔮" },
    { id: "leaderboard",   label: t("ranks"),   icon: "🏅" },
    { id: "notifications", label: t("alerts"),  icon: "🔔" },
    ...(isAdmin ? [{ id: "admin", label: t("admin"), icon: "⚙️" }] : []),
  ];

  return (
    <div>
      {page === "dashboard"     && <Dashboard    onNavigate={setPage} />}
      {page === "history"       && <History      />}
      {page === "predictions"   && <Predictions  />}
      {page === "leaderboard"   && <Leaderboard  />}
      {page === "notifications" && <Notifications />}
      {page === "admin"         && <Admin        />}

      <nav className="c-bottom-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            onClick={() => setPage(tab.id)}
            className={`c-nav-item ${page === tab.id ? "active" : ""}`}
          >
            <span className="c-nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <button id="nav-logout" onClick={handleLogout} className="c-nav-item">
          <span className="c-nav-icon">🚪</span>
          {t("logout")}
        </button>
      </nav>
    </div>
  );
}
