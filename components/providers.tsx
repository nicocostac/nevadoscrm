"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { SessionProvider } from "@/lib/auth/session-context";
import type { Profile } from "@/lib/types";
import { SupabaseProvider, useSupabaseClient } from "@/lib/supabase/supabase-context";

type ProvidersProps = {
  children: ReactNode;
  initialSession: Session | null;
  initialProfile: Profile | null;
};

export function Providers({ children, initialSession, initialProfile }: ProvidersProps) {
  const [session, setSession] = useState(initialSession);
  const [profile, setProfile] = useState(initialProfile);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <SupabaseProvider>
      <SessionProvider value={{ session, profile }}>
        <SessionSynchronizer setSession={setSession} setProfile={setProfile} />
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </SupabaseProvider>
  );
}

function SessionSynchronizer({
  setSession,
  setProfile,
}: {
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
}) {
  const supabase = useSupabaseClient();

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session ?? null);

        if (session?.user?.id) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!isMounted) return;

          setProfile((data as Profile) ?? null);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Failed to load session", error);
        if (!isMounted) return;
        setSession(null);
        setProfile(null);
      }
    };

    void syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);

      if (session?.user?.id) {
        void supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (!isMounted) return;
            setProfile((data as Profile) ?? null);
          })
          .catch(() => {
            if (!isMounted) return;
            setProfile(null);
          });
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [setProfile, setSession, supabase]);

  return null;
}
