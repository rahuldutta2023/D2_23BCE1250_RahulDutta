import { useState } from "react";
import '../pages/auth.css';

const API = "http://localhost:8000/api";

export default function Login({ onLogin }) {
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
        throw new Error(err.detail || "Login failed");
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

        <div className="auth-logo">
          <div className="auth-logo-icon">🌿</div>
          <h1>CarbonTrack</h1>
          <p>Smart Carbon Footprint Tracker</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-space">
          <div>
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            className="auth-btn"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>

        <p className="auth-footer">
          Don't have an account?{" "}
          <button onClick={() => window.location.hash = "register"}>Register</button>
        </p>
      </div>
    </div>
  );
}
