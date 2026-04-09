import { useState } from "react";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import Dashboard   from "./Dashboard";
import Leaderboard from "./pages/Leaderboard";
import History     from "./pages/History";
import './Dashboard.css';

export default function App() {
  const [page, setPage] = useState(localStorage.getItem("token") ? "dashboard" : "login");

  const handleLogin    = () => setPage("dashboard");
  const handleRegister = () => setPage("login");
  const handleLogout   = () => { localStorage.clear(); setPage("login"); };

  if (page === "login")    return <Login onLogin={handleLogin} />;
  if (page === "register") return <Register onRegister={handleRegister} />;

  const tabs = [
    { id: "dashboard",   label: "Dashboard",   icon: "🏠" },
    { id: "history",     label: "History",     icon: "📈" },
    { id: "leaderboard", label: "Leaderboard", icon: "🏅" },
  ];

  return (
    <div>
      {page === "dashboard"   && <Dashboard onNavigate={setPage} />}
      {page === "history"     && <History />}
      {page === "leaderboard" && <Leaderboard />}

      <nav className="c-bottom-nav">
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
