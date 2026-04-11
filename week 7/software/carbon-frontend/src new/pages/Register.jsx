import { useState } from "react";
import './auth.css';

const API    = "http://localhost:8000/api";
const CITIES = ["Bengaluru","Delhi","Mumbai","Chennai","Hyderabad","Pune","Kolkata"];

export default function Register({ onRegister }) {
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

  const fields = [
    ["full_name", "Full Name",  "text",     "Ravi Kumar"],
    ["email",     "Email",      "email",    "ravi@example.com"],
    ["password",  "Password",   "password", "••••••••"],
  ];

  return (
    <div className="auth-bg">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">🌱</div>
          <h1>Create Account</h1>
          <p>Join thousands tracking their carbon footprint</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-space">
          {fields.map(([k, label, type, ph]) => (
            <div key={k}>
              <label className="auth-label">{label}</label>
              <input
                className="auth-input"
                type={type}
                value={form[k]}
                onChange={e => update(k, e.target.value)}
                placeholder={ph}
              />
            </div>
          ))}

          <div>
            <label className="auth-label">City</label>
            <select className="auth-input" value={form.city} onChange={e => update("city", e.target.value)}>
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="auth-label">Household Size</label>
            <select className="auth-input" value={form.household_size} onChange={e => update("household_size", e.target.value)}>
              <option value="">Number of members</option>
              {[1,2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
              ))}
            </select>
          </div>

          <button
            className="auth-btn"
            onClick={handleSubmit}
            disabled={loading || Object.values(form).some(v => !v)}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>

        <p className="auth-footer">
          Already have an account?{" "}
          <button onClick={() => window.location.hash = "login"}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
