import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "../backend/src/trpc/router";
import { getApiBaseUrl } from "@/lib/api-base";
import { getSessionToken } from "@/lib/_core/auth";

export const trpc = createTRPCReact<AppRouter>();

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);
  const [client, setClient] = useState<ReturnType<typeof trpc.createClient> | null>(null);

  // Resolve the API base URL asynchronously (it can be configured and persisted).
  // Creating the client with a wrong URL can produce: "JSON Parse error: Unexpected character: <".
  useEffect(() => {
    let mounted = true;
    (async () => {
      const apiBase = await getApiBaseUrl(); // includes "/api"
      if (!mounted) return;
      setClient(
        trpc.createClient({
          transformer: superjson,
          links: [
            httpBatchLink({
              url: `${apiBase}/trpc`,
              async headers() {
                const token = await getSessionToken();
                return token ? { Authorization: `Bearer ${token}` } : {};
              },
            }),
          ],
        })
      );
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!client) return null;

  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
