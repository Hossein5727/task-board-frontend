"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/organisms/toaster";
import { setSessionExpiredHandler } from "@/lib/http/client";
import { isRetryable } from "@/lib/http/errors";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
      },
      mutations: { retry: false },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    let redirecting = false;
    setSessionExpiredHandler(() => {
      client.clear();
      if (redirecting || window.location.pathname.startsWith("/login")) return;
      redirecting = true;
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login?reason=expired&next=${next}`);
    });
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
