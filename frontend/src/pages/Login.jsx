import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(u) {
    setUsername(u);
    setPassword("Password123!");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(201,162,39,0.06),transparent_40%)] bg-bg">
      <div className="w-[420px] bg-panel border border-border rounded-[10px] px-8 py-9">
        <div className="flex flex-col items-center gap-1 mb-7">
          <span className="font-mono font-semibold tracking-[0.16em] text-accent text-[22px]">MAMS</span>
          <span className="text-xs text-text-muted">Military Asset Management System</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-[12.5px] text-text-muted">
            Username
            <input
              className="bg-panel-raised border border-border rounded-md px-3 py-2.5 text-text focus:outline-none focus:border-accent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] text-text-muted">
            Password
            <input
              className="bg-panel-raised border border-border rounded-md px-3 py-2.5 text-text focus:outline-none focus:border-accent"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <div className="bg-danger/10 border border-danger/40 text-[#e88] px-3.5 py-2.5 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            className="mt-1.5 bg-accent text-[#14150f] border-none px-4.5 py-2.5 rounded-md font-semibold cursor-pointer transition-[filter] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6.5 border-t border-border pt-4.5">
          <p className="text-[11.5px] text-text-muted mb-2.5 uppercase tracking-wide">
            Demo accounts (password: Password123!)
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              className="text-left bg-panel-raised border border-border text-text-muted px-3 py-2 rounded-md cursor-pointer text-[12.5px] font-mono hover:border-accent hover:text-text"
              onClick={() => fillDemo("admin")}
            >
              admin — full access
            </button>
            <button
              type="button"
              className="text-left bg-panel-raised border border-border text-text-muted px-3 py-2 rounded-md cursor-pointer text-[12.5px] font-mono hover:border-accent hover:text-text"
              onClick={() => fillDemo("cmd.alpha")}
            >
              cmd.alpha — Fort Alpha commander
            </button>
            <button
              type="button"
              className="text-left bg-panel-raised border border-border text-text-muted px-3 py-2 rounded-md cursor-pointer text-[12.5px] font-mono hover:border-accent hover:text-text"
              onClick={() => fillDemo("cmd.bravo")}
            >
              cmd.bravo — Base Bravo commander
            </button>
            <button
              type="button"
              className="text-left bg-panel-raised border border-border text-text-muted px-3 py-2 rounded-md cursor-pointer text-[12.5px] font-mono hover:border-accent hover:text-text"
              onClick={() => fillDemo("logistics1")}
            >
              logistics1 — logistics officer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
