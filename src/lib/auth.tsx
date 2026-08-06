import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";

export type Role =
  | "Administrator"
  | "Restaurant Manager"
  | "Kitchen Staff"
  | "Cashier"
  | "Viewer";

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
//const API_URL = "http://localhost:8000";
const API_URL = import.meta.env.VITE_API_URL;


console.log(API_URL);


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
  const [ready, setReady] =useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);

    if (raw) {
      try {
        setSession(JSON.parse(raw));
      } catch {
        localStorage.removeItem(KEY);
      }
    }

    setReady(true);
  }, []);

  const signIn = async (
    username: string,
    password: string
  ): Promise<Session> => {
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

    const next: Session = {
      username,
      token: data.token,
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

  useEffect(() => {
    if (ready && !session) {
      navigate({
        to: "/",
        replace: true,
      });
    }
  }, [ready, session, navigate]);

  return session;
}

/**
 * Helper for authenticated API requests.
 */
export async function api(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
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