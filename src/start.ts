import { createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { installNetworkGuard } from "@/lib/network-guard";
import { installPerfTier } from "@/lib/perf-tier";

if (typeof window !== "undefined") {
  installNetworkGuard();
  try {
    installPerfTier();
  } catch {
    /* noop */
  }
}

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
}));
