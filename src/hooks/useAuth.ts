import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/integrations/supabase/lazy";
import { isOfflineDemo, getLocalDemoUser } from "@/lib/offline-demo";

export type Profile = {
  id: string;
  display_name: string;
  avatar_seed: number;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
};

let cached: AuthState = { loading: true, session: null, user: null, profile: null };
const listeners = new Set<(s: AuthState) => void>();

function emit(next: AuthState) {
  cached = next;
  listeners.forEach((fn) => fn(cached));
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_seed")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[auth] loadProfile error", error);
    return null;
  }
  return data as Profile | null;
}

let bootstrapped = false;
function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;

  if (isOfflineDemo()) {
    const pushDemo = () => {
      const demo = getLocalDemoUser();
      emit({
        loading: false,
        session: null,
        user: null,
        profile: { id: demo.id, display_name: demo.alias, avatar_seed: 0 },
      });
    };
    pushDemo();

    if (typeof window !== "undefined") {
      window.addEventListener("cuervo:alias:changed", pushDemo);
    }
    return;
  }

  void (async () => {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const profile = session?.user ? await loadProfile(session.user.id) : null;
    emit({ loading: false, session, user: session?.user ?? null, profile });
    supabase.auth.onAuthStateChange(async (_event, next) => {
      const nextProfile = next?.user ? await loadProfile(next.user.id) : null;
      emit({ loading: false, session: next, user: next?.user ?? null, profile: nextProfile });
    });
  })();
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(cached);

  useEffect(() => {
    bootstrap();
    listeners.add(setState);
    setState(cached);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const signOut = useCallback(async () => {
    if (isOfflineDemo()) return;
    const supabase = await getSupabase();
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (isOfflineDemo()) return;
    if (!cached.user) return;
    const profile = await loadProfile(cached.user.id);
    emit({ ...cached, profile });
  }, []);

  return { ...state, signOut, refreshProfile };
}
