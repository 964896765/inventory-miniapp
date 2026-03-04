import Constants from "expo-constants";

/**
 * Resolve API base URL.
 * Priority:
 * 1) EXPO_PUBLIC_API_URL (e.g. http://192.168.1.10:3000)
 * 2) Use Expo dev server host (debuggerHost/hostUri) and assume backend on :3000
 * 3) localhost
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/$/, "");

  // Try multiple places across Expo Go / dev builds.
  const anyConst: any = Constants as any;
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ||
    anyConst?.manifest2?.extra?.expoClient?.hostUri ||
    anyConst?.manifest?.hostUri ||
    anyConst?.manifest?.debuggerHost ||
    anyConst?.manifest2?.extra?.expoGo?.debuggerHost ||
    anyConst?.manifest2?.extra?.expoClient?.debuggerHost;

  const host = hostUri ? String(hostUri).split(":")[0] : "localhost";
  return `http://${host}:3000`;
}

export const API_BASE_URL = getApiBaseUrl();
export const TRPC_PATH = "/api/trpc";
