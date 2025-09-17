"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import type { Attachment } from "@/lib/types";

const attachmentSelect =
  "*, created_by:profiles!attachments_created_by_fkey(id, full_name, email)";

export function useAttachments(leadId: string) {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`attachments-lead-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attachments",
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byLead(leadId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient, supabase]);

  return useQuery({
    queryKey: queryKeys.attachments.byLead(leadId),
    queryFn: async (): Promise<Attachment[]> => {
      const { data, error } = await supabase
        .from("attachments")
        .select(attachmentSelect)
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Attachment[]) ?? [];
    },
  });
}
