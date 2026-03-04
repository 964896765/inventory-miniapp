import { useCallback, useEffect, useMemo, useState } from "react";

import { apiClient } from "@/lib/api";
import { clearSession, getSessionToken, getUserInfo, setSessionToken, setUserInfo, type UserInfo } from "@/lib/_core/auth";

type UseAuthOptions = {
  autoFetch?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getSessionToken();
      if (!token) {
        setUser(null);
        return;
      }

      // Prefer cached user info (fast). If missing, fetch from API.
      const cached = await getUserInfo();
      if (cached) {
        setUser(cached);
        return;
      }

      const { data } = await apiClient.get("/auth/me");
      const info: UserInfo = { id: data.id, username: data.username, name: data.name };
      await setUserInfo(info);
      setUser(info);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to load session");
      setError(err);
      setUser(null);
      await clearSession();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post("/auth/login", { username, password });
      await setSessionToken(data.token);
      const info: UserInfo = { id: data.user.id, username: data.user.username, name: data.user.name };
      await setUserInfo(info);
      setUser(info);
      return { ok: true } as const;
    } catch (e) {
      const msg = (e as any)?.response?.data?.message || (e as any)?.message || "登录失败";
      const err = new Error(msg);
      setError(err);
      setUser(null);
      await clearSession();
      return { ok: false, message: msg } as const;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout").catch(() => void 0);
    } finally {
      await clearSession();
      setUser(null);
      setError(null);
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    if (!autoFetch) {
      setLoading(false);
      return;
    }
    refresh();
  }, [autoFetch, refresh]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    refresh,
  };
}
