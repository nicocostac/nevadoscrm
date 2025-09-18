"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";

import { SessionProvider } from "@/lib/auth/session-context";
import type { Profile } from "@/lib/types";
import { SupabaseProvider, useSupabaseClient } from "@/lib/supabase/supabase-context";

type ProvidersProps = {
  children: ReactNode;
  initialSession: Session | null;
  initialProfile: Profile | null;
  initialUser: User | null;
};

const SESSION_EXPIRY_GRACE_MS = 5 * 60 * 1000;
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "keydown",
  "mousedown",
  "touchstart",
];

export function Providers({ children, initialSession, initialProfile, initialUser }: ProvidersProps) {
  const [session, setSession] = useState(initialSession);
  const [profile, setProfile] = useState(initialProfile);
  const [user, setUser] = useState(initialUser);
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
      <SessionProvider value={{ session, user, profile }}>
        <SessionSynchronizer
          session={session}
          setSession={setSession}
          setProfile={setProfile}
          setUser={setUser}
        />
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </SupabaseProvider>
  );
}

function SessionSynchronizer({
  session,
  setSession,
  setProfile,
  setUser,
}: {
  session: Session | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setUser: (user: User | null) => void;
}) {
  const supabase = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const [sessionResponse, userResponse] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

        if (!isMounted) return;

        const nextSession = sessionResponse.data.session ?? null;
        const nextUser = userResponse.data.user ?? null;

        setSession(nextSession);
        setUser(nextUser);

        if (nextUser?.id) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", nextUser.id)
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
        setUser(null);
        setProfile(null);
      }
    };

    void syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        try {
          if (!isMounted) return;
          setSession(session ?? null);

          const { data } = await supabase.auth.getUser();
          if (!isMounted) return;

          const nextUser = data.user ?? null;
          setUser(nextUser);

          if (nextUser?.id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", nextUser.id)
              .maybeSingle();

            if (!isMounted) return;
            setProfile((profileData as Profile) ?? null);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Failed to refresh session state", error);
          if (!isMounted) return;
          setSession(session ?? null);
          setUser(null);
          setProfile(null);
        }
      })();
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [setProfile, setSession, setUser, supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let expiryTimer: ReturnType<typeof setTimeout> | null = null;
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    let listenersAttached = false;
    let forcedSignOut = false;

    const clearExpiryTimer = () => {
      if (expiryTimer) {
        clearTimeout(expiryTimer);
        expiryTimer = null;
      }
    };

    const clearInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
    };

    const detachListeners = () => {
      if (!listenersAttached) return;
      listenersAttached = false;
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    const navigateToLogin = (reason: string) => {
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("reason", reason);
      loginUrl.searchParams.set("redirect", window.location.pathname);
      router.replace(loginUrl.toString());
    };

    const handleForcedSignOut = async (reason: "expired" | "inactive") => {
      if (forcedSignOut) return;
      forcedSignOut = true;
      clearExpiryTimer();
      clearInactivityTimer();
      detachListeners();

      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Failed to sign out after session enforcement", error);
      }

      setSession(null);
      setProfile(null);
      setUser(null);
      navigateToLogin(`session-${reason}`);
    };

    const scheduleExpiryCheck = () => {
      clearExpiryTimer();
      if (!session?.expires_at) return;
      const logoutAt = session.expires_at * 1000 - SESSION_EXPIRY_GRACE_MS;
      const delay = Math.max(logoutAt - Date.now(), 0);

      if (delay <= 0) {
        void handleForcedSignOut("expired");
        return;
      }

      expiryTimer = window.setTimeout(() => {
        void handleForcedSignOut("expired");
      }, delay);
    };

    const resetInactivityTimer = () => {
      clearInactivityTimer();
      inactivityTimer = window.setTimeout(() => {
        void handleForcedSignOut("inactive");
      }, INACTIVITY_LIMIT_MS);
    };

    const handleActivity = () => {
      forcedSignOut = false;
      resetInactivityTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };

    const attachListeners = () => {
      if (listenersAttached) return;
      listenersAttached = true;
      ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity));
      document.addEventListener("visibilitychange", handleVisibilityChange);
    };

    if (session) {
      attachListeners();
      resetInactivityTimer();
      scheduleExpiryCheck();
    } else {
      detachListeners();
      clearExpiryTimer();
      clearInactivityTimer();
    }

    return () => {
      detachListeners();
      clearExpiryTimer();
      clearInactivityTimer();
    };
  }, [router, session, setProfile, setSession, setUser, supabase]);

  return null;
}
