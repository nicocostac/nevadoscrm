"use client"

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createOpportunityAction,
  updateOpportunityStageAction,
  type OpportunityInput,
  type OpportunityStageInput,
} from "@/app/(app)/actions/opportunities";
import { queryKeys } from "@/lib/query/keys";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import type { Opportunity } from "@/lib/types";

const opportunitySelect =
  "*, owner:profiles!opportunities_owner_id_fkey(id, full_name), account:accounts(id, name), lead:leads(id, name)";

const opportunitySelect =
  "*, owner:profiles!opportunities_owner_id_fkey(id, full_name), account:accounts(id, name), lead:leads(id, name)";

export function useOpportunities() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("opportunities")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);

  return useQuery({
    queryKey: queryKeys.opportunities.all,
    queryFn: async (): Promise<Opportunity[]> => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(opportunitySelect)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Opportunity[]) ?? [];
    },
  });
}

export function useOpportunityStageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OpportunityStageInput) => updateOpportunityStageAction(input),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.opportunities.all });
      const previous = queryClient.getQueryData<Opportunity[]>(queryKeys.opportunities.all);
      if (previous) {
        queryClient.setQueryData<Opportunity[]>(
          queryKeys.opportunities.all,
          previous.map((item) =>
            item.id === id
              ? {
                  ...item,
                  stage,
                }
              : item
          )
        );
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      console.error(error);
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.opportunities.all, context.previous);
      }
      toast.error("No se pudo mover la oportunidad");
    },
    onSuccess: (opportunity) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      toast.success("Pipeline actualizado", {
        description: `${opportunity.name} → ${opportunity.stage}`,
      });
    },
  });
}

export function useOpportunityCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OpportunityInput) => createOpportunityAction(input),
    onSuccess: (opportunity) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      if (opportunity.lead?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(opportunity.lead.id) });
      }
      toast.success("Oportunidad creada", {
        description: `${opportunity.name} se agregó al pipeline`,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo crear la oportunidad");
    },
  });
}
