import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AnimatedBackground from "../../components/AnimatedBackground";
import Logo from "../../assets/Logo.png";
import "./index.css";

/* ── Inline SVG Icons ── */
const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ══════════════════════════════════════════════
   LOGIN COMPONENT
══════════════════════════════════════════════ */
const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <AnimatedBackground />

      {/* Card */}
      <div className="login-card">

        {/* Badge */}
        <div className="login-badge">
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="login-badge-ring" aria-hidden="true" />
            <div className="login-badge-icon" aria-hidden="true">
              <img src={Logo} alt="King Panthera Logo" className="login-logo-img" />
            </div>
          </div>
        </div>


        {/* Header */}
        <div className="login-header">
          <h1>King Panthera <span>Management</span></h1>
          <p>Sign in to access your dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div className="lgn-alert" role="alert">
            <AlertIcon />
            {error}
          </div>
        )}

        {/* Form — using lgn- prefixed classes only */}
        <form onSubmit={handleSubmit} className="lgn-form" noValidate>

          {/* Username field */}
          <div className="lgn-field">
            <label htmlFor="lgn-username" className="lgn-label">Username</label>
            <div className="lgn-input-row">
              <span className="lgn-icon"><UserIcon /></span>
              <input
                type="text"
                id="lgn-username"
                className="lgn-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="lgn-field">
            <label htmlFor="lgn-password" className="lgn-label">Password</label>
            <div className="lgn-input-row">
              <span className="lgn-icon"><LockIcon /></span>
              <input
                type={showPassword ? "text" : "password"}
                id="lgn-password"
                className="lgn-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="lgn-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="lgn-btn"
            disabled={loading}
            id="login-submit"
          >
            {loading ? (
              <><span className="lgn-spinner" aria-hidden="true" />Signing in…</>
            ) : "Sign In"}
          </button>

        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>© {new Date().getFullYear()} King Panthera · All rights reserved</p>
        </div>

      </div>
    </div>
  );
};

export default Login;
