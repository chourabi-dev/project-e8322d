import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { canAccess, resolveRole, roleFromToken, type Role } from "@/lib/roles";

export type { Role };

export interface Session {
  username: string;
  token: string;
  name?: string;
  role?: Role;
}

interface AuthContextType {
  session: Session | null;
  ready: boolean;
  signIn: (username: string, password: string) => Promise<Session>;
  signOut: () => void;
}

const KEY = "aveline-session";

const API_URL = import.meta.env["VITE_API_URL"];

const AuthContext = createContext<AuthContextType>({
  session: null,
  ready: false,
  signIn: async () => {
    throw new Error("AuthProvider not initialized");
  },
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);

    if (raw) {
      try {
        const stored: Session = JSON.parse(raw);
        // Sessions saved before roles existed: recover the role from the token.
        const role = stored.role ?? roleFromToken(stored.token);
        setSession(role ? { ...stored, role } : stored);
      } catch {
        localStorage.removeItem(KEY);
      }
    }

    setReady(true);
  }, []);

  const signIn = async (username: string, password: string): Promise<Session> => {
    const response = await fetch(`${API_URL}/api/login_check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      let message = "Invalid username or password";

      try {
        const error = await response.json();
        message = error.message || error.error || message;
      } catch {}

      throw new Error(message);
    }

    const data = await response.json();

    const role = resolveRole(data, data.token);
    const next: Session = {
      username,
      token: data.token,
      ...(role ? { role } : {}),
    };

    localStorage.setItem(KEY, JSON.stringify(next));
    setSession(next);

    return next;
  };

  const signOut = () => {
    localStorage.removeItem(KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        ready,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Protects private routes.
 */
export function useRequireAuth() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const allowed = canAccess(session?.role, pathname);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      navigate({ to: "/", replace: true });
    } else if (!allowed) {
      // Signed in, but this role may not open this page.
      navigate({ to: "/dashboard", replace: true });
    }
  }, [ready, session, allowed, navigate]);

  return session && allowed ? session : null;
}

/**
 * Helper for authenticated API requests.
 */
export async function api(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const raw = localStorage.getItem(KEY);
  const session: Session | null = raw ? JSON.parse(raw) : null;

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}
