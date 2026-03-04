/**
 * App theme configuration.
 *
 * This file is imported by `lib/_core/theme.ts` via `@/theme.config`.
 * It was missing, which caused the runtime crash:
 *   TypeError: Cannot convert undefined value to object
 */

const themeConfig = {
  themeColors: {
    light: {
      foreground: "#0f172a",
      background: "#ffffff",
      primary: "#2563eb",
      muted: "#f1f5f9",
      border: "#e2e8f0",
    },
    dark: {
      foreground: "#f8fafc",
      background: "#0b1220",
      primary: "#60a5fa",
      muted: "#111827",
      border: "#1f2937",
    },
  },
} as const;

export default themeConfig;
