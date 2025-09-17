"use client";

import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

import type { Profile } from "@/lib/types";

export type SessionContextValue = {
  session: Session | null;
  profile: Profile | null;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({
  value,
  children,
}: {
  value: SessionContextValue;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
