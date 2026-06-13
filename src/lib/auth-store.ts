/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { AuthAPI } from "../services/api";
import { initializeSocket, disconnectSocket } from "./socket";

export interface SessionUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<SessionUser>;
  signup: (
    fullName: string,
    email: string,
    password: string,
    departmentId: string,
    designation: string,
    role: string,
  ) => Promise<SessionUser & { isPending?: boolean }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<SessionUser | null>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  async login(email, password, remember) {
    try {
      const res = (await AuthAPI.login({ email, password, remember })) as any;
      const { user, accessToken, refreshToken } = res;
      AuthAPI.saveTokens(accessToken, refreshToken);
      set({ user, loading: false });
      initializeSocket(accessToken);
      return user;
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(err.message || "Invalid credentials");
    }
  },

  async signup(fullName, email, password, departmentId, designation, role) {
    try {
      const res = (await AuthAPI.register({
        fullName,
        email,
        password,
        departmentId,
        designation,
        role,
      })) as any;
      if (res?.user?.isPending) {
        set({ user: null, loading: false });
        return res.user;
      }
      AuthAPI.saveTokens(res.accessToken, res.refreshToken);
      set({ user: res.user, loading: false });
      initializeSocket(res.accessToken);
      return res.user;
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(err.message || "Failed to sign up");
    }
  },

  async logout() {
    try {
      const tokens = AuthAPI.getTokens();
      if (tokens?.refreshToken) {
        await AuthAPI.logout(tokens.refreshToken);
      }
    } finally {
      AuthAPI.clearTokens();
      disconnectSocket();
      set({ user: null, loading: false });
    }
  },

  async checkSession() {
    set({ loading: true });
    try {
      const tokens = AuthAPI.getTokens();
      if (!tokens?.accessToken) {
        set({ user: null, loading: false });
        return null;
      }

      const res = (await AuthAPI.getMe()) as any;
      set({ user: res.user, loading: false });
      initializeSocket(tokens.accessToken);
      return res.user;
    } catch {
      AuthAPI.clearTokens();
      disconnectSocket();
      set({ user: null, loading: false });
      return null;
    }
  },
}));
