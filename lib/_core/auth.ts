import * as SecureStore from "expo-secure-store";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/auth";

export type UserInfo = {
  id: number;
  username: string;
  name?: string | null;
};

export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string | null): Promise<void> {
  try {
    if (!token) {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
      return;
    }
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SESSION_TOKEN_KEY).catch(() => void 0),
    SecureStore.deleteItemAsync(USER_INFO_KEY).catch(() => void 0),
  ]);
}

export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export async function setUserInfo(info: UserInfo | null): Promise<void> {
  try {
    if (!info) {
      await SecureStore.deleteItemAsync(USER_INFO_KEY);
      return;
    }
    await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(info));
  } catch {
    // ignore
  }
}
