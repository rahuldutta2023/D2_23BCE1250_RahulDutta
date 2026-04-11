import { useState } from "react";
import { useLang, LANGUAGES } from "../i18n";
import './auth.css';

const API    = "http://localhost:8000/api";
const CITIES = ["Bengaluru","Delhi","Mumbai","Chennai","Hyderabad","Pune","Kolkata"];

export default function Register({ onRegister, onLogin }) {
  const { lang, changeLang, t } = useLang();
  const [form,    setForm]    = useState({ full_name:"", email:"", password:"", city:"", household_size:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const res  = await fetch(`${API}/auth/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...form, household_size: parseInt(form.household_size) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.detail || "Registration failed"); return; }
    onRegister(data);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">

        {/* Language switcher */}
        <div className="auth-lang">
          <select value={lang} onChange={e => changeLang(e.target.value)} id="register-lang-select">
            {Object.entries(LANGUAGES).map(([code, info]) => (
              <option key={code} value={code}>{info.flag} {info.name}</option>
            ))}
          </select>
        </div>

        <div className="auth-logo">
          <div className="auth-logo-icon">🌱</div>
          <h1>{t("createAccount")}</h1>
          <p>Join thousands tracking their carbon footprint</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-space">
          {[
            ["full_name", t("fullName"), "text",     "Ravi Kumar"],
            ["email",     t("email"),    "email",    "ravi@example.com"],
            ["password",  t("password"), "password", "••••••••"],
          ].map(([k, label, type, ph]) => (
            <div key={k}>
              <label className="auth-label">{label}</label>
              <input
                id={`reg-${k}`}
                className="auth-input"
                type={type}
                value={form[k]}
                onChange={e => update(k, e.target.value)}
                placeholder={ph}
              />
            </div>
          ))}

          <div>
            <label className="auth-label">{t("city")}</label>
            <select id="reg-city" className="auth-input" value={form.city} onChange={e => update("city", e.target.value)}>
              <option value="">{t("selectCity")}</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="auth-label">{t("householdSize")}</label>
            <select id="reg-size" className="auth-input" value={form.household_size} onChange={e => update("household_size", e.target.value)}>
              <option value="">{t("numberMembers")}</option>
              {[1,2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? t("person") : t("people")}</option>
              ))}
            </select>
          </div>

          <button
            id="register-submit"
            className="auth-btn"
            onClick={handleSubmit}
            disabled={loading || Object.values(form).some(v => !v)}
          >
            {loading ? t("creatingAccount") : t("createAccount")}
          </button>
        </div>

        <p className="auth-footer">
          {t("haveAccount")}{" "}
          <button id="register-go-login" onClick={onLogin}>{t("signIn")}</button>
        </p>
      </div>
    </div>
  );
}
