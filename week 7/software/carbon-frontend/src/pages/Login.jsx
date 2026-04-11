import { useState } from "react";
import { useLang, LANGUAGES } from "../i18n";
import '../pages/auth.css';

const API = "http://localhost:8000/api";

export default function Login({ onLogin, onRegister }) {
  const { lang, changeLang, t } = useLang();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);

      const res = await fetch(`${API}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || t("loginFailed"));
      }

      const data = await res.json();
      localStorage.setItem("token",     data.access_token);
      localStorage.setItem("user_id",   data.user_id);
      localStorage.setItem("full_name", data.full_name);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">

        {/* Language switcher */}
        <div className="auth-lang">
          <select value={lang} onChange={e => changeLang(e.target.value)} id="login-lang-select">
            {Object.entries(LANGUAGES).map(([code, info]) => (
              <option key={code} value={code}>{info.flag} {info.name}</option>
            ))}
          </select>
        </div>

        <div className="auth-logo">
          <div className="auth-logo-icon">🌿</div>
          <h1>{t("appName")}</h1>
          <p>{t("appTagline")}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-space">
          <div>
            <label className="auth-label">{t("email")}</label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="auth-label">{t("password")}</label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
            />
          </div>
          <button
            id="login-submit"
            className="auth-btn"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </div>

        <p className="auth-footer">
          {t("noAccount")}{" "}
          <button id="login-go-register" onClick={onRegister}>{t("register")}</button>
        </p>
      </div>
    </div>
  );
}
