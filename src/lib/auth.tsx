import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

export type Role = "Administrator" | "Restaurant Manager" | "Kitchen Staff" | "Cashier" | "Viewer";

export type Session = { username: string; name: string; role: Role };

const KEY = "aveline-session";

const AuthContext = createContext<{
  session: Session | null;
  ready: boolean;
  signIn: (username: string, password: string) => Session;
  signOut: () => void;
}>({ session: null, ready: false, signIn: () => ({}) as Session, signOut: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      try {
        setSession(JSON.parse(raw) as Session);
      } catch {
        window.localStorage.removeItem(KEY);
      }
    }
    setReady(true);
  }, []);

  const signIn = (username: string, _password: string) => {
    const next: Session = {
      username,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      role: "Administrator",
    };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setSession(next);
    return next;
  };

  const signOut = () => {
    window.localStorage.removeItem(KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, ready, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Client-side guard for demo workspace routes. */
export function useRequireAuth() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !session) navigate({ to: "/", replace: true });
  }, [ready, session, navigate]);

  return session;
}
