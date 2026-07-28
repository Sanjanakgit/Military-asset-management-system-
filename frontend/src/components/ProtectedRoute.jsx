import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-16 text-center text-text-muted">
        <h2 className="text-text text-xl font-semibold mb-2">Access restricted</h2>
        <p>Your role ({roleLabel(user.role)}) does not have access to this section.</p>
      </div>
    );
  }

  return children;
}

export function roleLabel(role) {
  return (
    {
      admin: "Administrator",
      base_commander: "Base Commander",
      logistics_officer: "Logistics Officer",
    }[role] || role
  );
}
