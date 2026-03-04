import axios from "axios";

import { DEFAULT_BASE, getApiBaseUrl } from "@/lib/api-base";
import { clearSession, getSessionToken } from "@/lib/_core/auth";

export const apiClient = axios.create({
  // Use a safe default; the real base URL may be configured at runtime.
  baseURL: DEFAULT_BASE,
  timeout: 20_000,
});

apiClient.interceptors.request.use(async (config) => {
  // Keep baseURL in sync with persisted setting (AsyncStorage).
  config.baseURL = await getApiBaseUrl();

  const token = await getSessionToken();
  if (token) {
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Session expired or missing/invalid token.
      await clearSession();
      // Do not throw a new Error here; let callers handle rejection.
    }
    return Promise.reject(error);
  }
);
