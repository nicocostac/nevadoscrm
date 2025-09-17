"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createSupabaseBrowserClient());

  return (
    <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
  );
}

export function useSupabaseClient() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabaseClient must be used within a SupabaseProvider");
  }
  return context;
}
