"use client";
import { create } from "zustand";
import { api } from "@/lib/api";

export type AuthUser = { id: number; name: string; email: string };

type AuthState = {
  user: AuthUser | null;
  checked: boolean;
  fetchUser: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  checked: false,
  fetchUser: async () => {
    try {
      const user = await api<AuthUser>("/api/user");
      set({ user, checked: true });
      return user;
    } catch {
      set({ user: null, checked: true });
      return null;
    }
  },
  login: async (email, password) => {
    const user = await api<AuthUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    set({ user, checked: true });
    return user;
  },
  register: async (name, email, password) => {
    const user = await api<AuthUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    set({ user, checked: true });
    return user;
  },
  logout: async () => {
    await api<void>("/api/auth/logout", { method: "POST" });
    set({ user: null, checked: true });
  },
}));
