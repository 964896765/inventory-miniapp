import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const KEY = "inventory.apiBaseUrl";

// Default should include `/api` (e.g. http://192.168.1.10:3000/api)
const DEFAULT_BASE =
  process.env.EXPO_PUBLIC_API_URL?.trim() || "http://localhost:3000/api";

export async function getApiBaseUrl(): Promise<string> {
  const saved = (await AsyncStorage.getItem(KEY))?.trim();
  return saved || DEFAULT_BASE;
}

export async function setApiBaseUrl(value: string): Promise<void> {
  const v = value.trim().replace(/\/+$/, "");
  await AsyncStorage.setItem(KEY, v);
}

function normalizeAndroidLocalhost(base: string) {
  // Helpful default for Android emulator. On physical devices you should set your PC LAN IP.
  if (Platform.OS !== "android") return base;
  return base
    .replace("http://localhost", "http://10.0.2.2")
    .replace("http://127.0.0.1", "http://10.0.2.2");
}

export async function apiUrl(pathname: string): Promise<string> {
  const base = normalizeAndroidLocalhost(await getApiBaseUrl());
  const path = pathname ? (pathname.startsWith("/") ? pathname : `/${pathname}`) : "";
  return `${base}${path}`;
}
