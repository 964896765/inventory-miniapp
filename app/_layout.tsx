import { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeProvider } from "@/lib/theme-provider";
import { TrpcProvider } from "@/lib/trpc";
import { getSessionToken } from "@/lib/_core/auth";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const inAuthGroup = useMemo(() => segments[0] === "(auth)", [segments]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getSessionToken();
      if (cancelled) return;
      setHasToken(Boolean(token));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [segments[0]]);

  useEffect(() => {
    if (!ready) return;

    if (!hasToken && !inAuthGroup) {
      router.replace("/login");
      return;
    }

    if (hasToken && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [ready, hasToken, inAuthGroup, router]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TrpcProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </TrpcProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
