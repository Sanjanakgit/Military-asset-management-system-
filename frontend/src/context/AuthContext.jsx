import { createContext, useContext, useState, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("mams_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (username, password) => {
    const res = await client.post("/auth/login", { username, password });
    localStorage.setItem("mams_token", res.data.token);
    localStorage.setItem("mams_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mams_token");
    localStorage.removeItem("mams_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
