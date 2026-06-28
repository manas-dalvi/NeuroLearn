"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api, parseErrorDetail } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UserType {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: UserType | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Auto-refresh token on mount/page reload and periodically
  useEffect(() => {
    const refreshSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (res.ok) {
          const data = await res.json();
          setToken(data.access_token);
          // Fetch user profile info
          try {
            const profile = await api.getProfile(data.access_token);
            setUser({
              uid: profile.user_id,
              email: profile.email,
              displayName: profile.full_name,
              photoURL: null
            });
          } catch {
            setUser({
              uid: "user-pending",
              email: null,
              displayName: "Learner",
              photoURL: null
            });
          }
        } else {
          // Clear credentials on failed refresh
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn("Could not automatically refresh session", err);
      } finally {
        setLoading(false);
      }
    };

    refreshSession();

    // Set up periodic background refresh every 10 minutes
    const intervalId = setInterval(refreshSession, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(parseErrorDetail(err));
    }

    const data = await res.json();
    setToken(data.access_token);

    // Fetch user profile to get displayName
    try {
      const profile = await api.getProfile(data.access_token);
      setUser({
        uid: profile.user_id,
        email,
        displayName: profile.full_name,
        photoURL: null
      });
    } catch {
      setUser({
        uid: "user-" + Date.now(),
        email,
        displayName: email.split("@")[0],
        photoURL: null
      });
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, full_name: name })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Signup failed" }));
      throw new Error(parseErrorDetail(err));
    }

    // Automatically log in after successful signup
    await signIn(email, password);
  };

  const signInWithGoogle = async () => {
    throw new Error("Google Sign-In is not supported by custom FastAPI backend. Please use email registration.");
  };

  const logout = async () => {
    try {
      await fetch(`${BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      console.warn("Failed to notify backend of logout", err);
    } finally {
      setUser(null);
      setToken(null);
    }
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
