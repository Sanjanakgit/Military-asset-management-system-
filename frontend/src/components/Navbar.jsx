import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "./ProtectedRoute";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="flex items-center gap-8 px-7 py-3.5 bg-panel border-b border-border sticky top-0 z-10 flex-wrap">
      <div className="flex flex-col leading-tight">
        <span className="font-mono font-semibold tracking-[0.12em] text-accent text-[15px]">MAMS</span>
        <span className="text-[11px] text-text-muted tracking-wide">Asset Management System</span>
      </div>

      <nav className="flex gap-1 flex-1 order-3 w-full overflow-x-auto md:order-none md:w-auto">
        <NavLink to="/dashboard" className={navClass}>
          Dashboard
        </NavLink>
        <NavLink to="/purchases" className={navClass}>
          Purchases
        </NavLink>
        <NavLink to="/transfers" className={navClass}>
          Transfers
        </NavLink>
        {user.role !== "logistics_officer" && (
          <NavLink to="/assignments" className={navClass}>
            Assignments &amp; Expenditures
          </NavLink>
        )}
      </nav>

      <div className="flex items-center gap-3.5">
        <div className="flex flex-col items-end leading-snug">
          <span className="text-[13px] font-semibold">{user.fullName}</span>
          <span className="text-[11px] text-text-muted font-mono">
            {roleLabel(user.role)}
            {user.base ? ` · ${user.base.name}` : ""}
          </span>
        </div>
        <button
          className="bg-transparent text-text-muted border border-border px-3.5 py-2 rounded-md cursor-pointer transition-colors hover:border-accent hover:text-text"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function navClass({ isActive }) {
  const base = "text-text-muted no-underline px-3.5 py-2 rounded-md text-[13.5px] font-medium transition-colors hover:text-text hover:bg-white/5";
  const active = "text-accent bg-accent/10 hover:text-accent";
  return isActive ? `${base} ${active}` : base;
}
