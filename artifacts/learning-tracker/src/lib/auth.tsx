import { createContext, useContext, useState, ReactNode } from "react";

export type Role = "management" | "coordinator" | "trainer" | "student" | null;

interface AuthState {
  role: Role;
  entityId: number | null;
  phone: string;
  name: string | null;
}

interface AuthContextType extends AuthState {
  setAuth: (data: AuthState) => void;
  setRole: (role: Role) => void;
  logout: () => void;
}

const SESSION_KEY = "kvf_auth";

function loadSession(): AuthState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {}
  return { role: null, entityId: null, phone: "", name: null };
}

function saveSession(state: AuthState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadSession);

  const setAuth = (data: AuthState) => {
    setState(data);
    saveSession(data);
  };

  const setRole = (role: Role) => {
    setState(prev => {
      const next = { ...prev, role };
      saveSession(next);
      return next;
    });
  };

  const logout = () => {
    const empty: AuthState = { role: null, entityId: null, phone: "", name: null };
    setState(empty);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ ...state, setAuth, setRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
