require("./scripts/load-env.js");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: "inventory-miniapp",
  slug: "inventory-miniapp",
  scheme: "inventory-miniapp",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  updates: { fallbackToCacheTimeout: 0 },
  // Some Expo native modules require config plugins when using EAS/dev builds.
  // `expo install` couldn't auto-write this file (dynamic config), so we add it here.
  plugins: ["expo-secure-store"],
  extra: {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  },
};