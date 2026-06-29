import type { User } from "@/lib/types";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiGet, apiPost } from "@/lib/apiClient";
import { hydrateFromServer } from "@/lib/db";

interface LoginPayload {
  identifier: string;
  password: string;
}

interface SignupPayload {
  identifier: string;
  identifierType: "email" | "phone";
  password: string;
  name: string;
  role: User["role"];
  vendorId?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  dataReady: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  async function loadData() {
    try {
      await hydrateFromServer();
      setDataReady(true);
    } catch (err) {
      console.error("[v0] data hydration failed:", err);
      setDataReady(false);
    }
  }

  // On mount, check for an existing session and hydrate data if authenticated.
  useEffect(() => {
    (async () => {
      try {
        const { user: sessionUser } = await apiGet<{ user: User | null }>("/api/auth/me");
        if (sessionUser) {
          setUser(sessionUser);
          await loadData();
        }
      } catch (err) {
        console.error("[v0] session check failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (payload: LoginPayload) => {
    const { user: loggedIn } = await apiPost<{ user: User }>("/api/auth/login", payload);
    setUser(loggedIn);
    await loadData();
  };

  const signup = async (payload: SignupPayload) => {
    const { user: created } = await apiPost<{ user: User }>("/api/auth/signup", payload);
    setUser(created);
    await loadData();
  };

  const logout = async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch (err) {
      console.error("[v0] logout failed:", err);
    }
    setUser(null);
    setDataReady(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, dataReady, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
