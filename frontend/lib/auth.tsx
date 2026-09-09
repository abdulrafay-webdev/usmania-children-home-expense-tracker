"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "./api";

export interface UserProfile {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = "uch_auth_user";
const STORAGE_KEY_TOKEN = "uch_auth_token";

export interface AdminAccount {
  email: string;
  password: string;
  name: string;
  role: string;
}

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    email: "saifurrehman@gmail.com",
    password: "Saif@1234",
    name: "Saif Ur Rehman",
    role: "Administrator",
  },
  {
    email: "kaleemullah@gmail.com",
    password: "Kaleemullah@1234",
    name: "Kaleemullah",
    role: "Administrator",
  },
  {
    email: "asadullah@gmail.com",
    password: "Asadullah@1234",
    name: "Asadullah",
    role: "Administrator",
  },
];

export const ADMIN_CREDENTIALS = ADMIN_ACCOUNTS[0];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load session from localStorage on initial render
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (emailInput: string, passwordInput: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    // 1. Try logging in via FastAPI backend
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
        return { success: true };
      }
    } catch {
      // Backend request failed, fallback to direct validation check
    }

    // 2. Client-side deterministic validation fallback
    const matchedAccount = ADMIN_ACCOUNTS.find(
      (acc) =>
        acc.email.toLowerCase() === cleanEmail && acc.password === cleanPassword
    );
    if (matchedAccount) {
      const fallbackUser: UserProfile = {
        email: matchedAccount.email,
        name: matchedAccount.name,
        role: matchedAccount.role,
      };
      const fallbackToken = "uch_admin_session_" + Date.now();
      setUser(fallbackUser);
      setToken(fallbackToken);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(fallbackUser));
      localStorage.setItem(STORAGE_KEY_TOKEN, fallbackToken);
      return { success: true };
    }

    return {
      success: false,
      error: "Invalid email or password. Please verify your credentials.",
    };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
