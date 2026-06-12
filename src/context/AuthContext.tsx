"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: MockUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ─── Demo Auth (no Firebase required) ────────────────────────────────────────
const DEMO_TOKEN = "demo-jwt-token-nlap-2025";

function createDemoUser(name: string, email: string): MockUser {
  return { uid: "demo-user-001", email, displayName: name, photoURL: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore demo session from localStorage
    if (DEMO_MODE) {
      try {
        const stored = localStorage.getItem("nlap_demo_user");
        if (stored) {
          setUser(JSON.parse(stored));
          setToken(DEMO_TOKEN);
        }
      } catch {}
      setLoading(false);
      return;
    }

    // Real Firebase auth (when DEMO_MODE = false)
    // Dynamic import to avoid breaking builds without Firebase config
    (async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import("firebase/auth");
        const { app } = await import("@/lib/firebase");
        const auth = getAuth(app);
        const unsub = onAuthStateChanged(auth, async (u) => {
          if (u) {
            setUser({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL });
            setToken(await u.getIdToken());
          } else {
            setUser(null);
            setToken(null);
          }
          setLoading(false);
        });
        return unsub;
      } catch {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      if (password.length < 3) throw new Error("Invalid credentials");
      const u = createDemoUser(email.split("@")[0], email);
      setUser(u);
      setToken(DEMO_TOKEN);
      localStorage.setItem("nlap_demo_user", JSON.stringify(u));
      return;
    }
    const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
    const { app } = await import("@/lib/firebase");
    await signInWithEmailAndPassword(getAuth(app), email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 900));
      const u = createDemoUser(name, email);
      setUser(u);
      setToken(DEMO_TOKEN);
      localStorage.setItem("nlap_demo_user", JSON.stringify(u));
      return;
    }
    const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    const { app } = await import("@/lib/firebase");
    const auth = getAuth(app);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
  };

  const signInWithGoogle = async () => {
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 700));
      const u = createDemoUser("Alex (Demo)", "alex@demo.nlap");
      setUser(u);
      setToken(DEMO_TOKEN);
      localStorage.setItem("nlap_demo_user", JSON.stringify(u));
      return;
    }
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const { app } = await import("@/lib/firebase");
    await signInWithPopup(getAuth(app), new GoogleAuthProvider());
  };

  const logout = async () => {
    if (DEMO_MODE) {
      localStorage.removeItem("nlap_demo_user");
      setUser(null);
      setToken(null);
      return;
    }
    const { getAuth, signOut } = await import("firebase/auth");
    const { app } = await import("@/lib/firebase");
    await signOut(getAuth(app));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
