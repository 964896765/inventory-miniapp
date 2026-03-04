import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { Colors, type ThemeMode } from "@/constants/theme";

export function useColors(overrides?: Partial<(typeof Colors)[ThemeMode]>) {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === "dark" ? "dark" : "light";
  const palette = Colors[mode];

  return useMemo(
    () => ({
      ...palette,
      ...(overrides ?? {}),
    }),
    [palette, overrides]
  );
}
