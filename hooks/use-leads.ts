"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createLeadAction, deleteLeadAction, updateLeadAction, type LeadInput, type LeadUpdateInput } from "@/app/(app)/actions/leads";
import { queryKeys } from "@/lib/query/keys";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import type { Lead } from "@/lib/types";

const leadSelect =
  "*, owner:profiles!leads_owner_id_fkey(id, full_name, role), account:accounts(id, name), contact:contacts(id, name, email, phone)";

export function useLeads() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("leads")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  return useQuery({
    queryKey: queryKeys.leads.all,
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select(leadSelect)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data as Lead[]) ?? [];
    },
  });
}

export function useLead(id: string) {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`lead-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(id) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient, supabase]);

  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<Lead | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("leads")
        .select(leadSelect)
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return (data as Lead) ?? null;
    },
  });
}

export function useLeadMutations() {
  const queryClient = useQueryClient();

  const invalidate = (leadId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
    if (leadId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
    }
  };

  const create = useMutation({
    mutationFn: (input: LeadInput) => createLeadAction(input),
    onSuccess: (lead) => {
      invalidate();
      toast.success("Lead creado", {
        description: `${lead.name} se agregó al pipeline`,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo crear el lead");
    },
  });

  const update = useMutation({
    mutationFn: (input: LeadUpdateInput) => updateLeadAction(input),
    onSuccess: (lead) => {
      invalidate(lead.id);
      toast.success("Lead actualizado");
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo actualizar el lead");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLeadAction(id),
    onSuccess: () => {
      invalidate();
      toast.success("Lead eliminado");
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo eliminar el lead");
    },
  });

  return {
    create,
    update,
    remove,
  };
}
