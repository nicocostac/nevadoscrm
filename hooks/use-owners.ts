"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import type { Profile } from "@/lib/types";

export function useOwners() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: queryKeys.owners,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, org_id")
        .order("full_name", { ascending: true, nullsFirst: false });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}
