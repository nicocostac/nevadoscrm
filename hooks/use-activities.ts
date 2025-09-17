"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createActivityAction,
  toggleActivityStatusAction,
  type ActivityInput,
} from "@/app/(app)/actions/activities";
import { queryKeys } from "@/lib/query/keys";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";
import type { Activity } from "@/lib/types";

const activitySelect =
  "*, owner:profiles!activities_owner_id_fkey(id, full_name), lead:leads(id, name), opportunity:opportunities(id, name)";

export function useActivities(leadId?: string) {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(leadId ? `activities-lead-${leadId}` : "activities")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
          ...(leadId ? { filter: `lead_id=eq.${leadId}` } : {}),
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: leadId ? queryKeys.activities.byLead(leadId) : queryKeys.activities.all,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient, supabase]);

  return useQuery({
    queryKey: leadId ? queryKeys.activities.byLead(leadId) : queryKeys.activities.all,
    queryFn: async (): Promise<Activity[]> => {
      const query = supabase
        .from("activities")
        .select(activitySelect)
        .order("created_at", { ascending: false });

      if (leadId) {
        query.eq("lead_id", leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Activity[]) ?? [];
    },
  });
}

export function useActivityMutations(leadId?: string) {
  const queryClient = useQueryClient();
  const queryKey = leadId
    ? queryKeys.activities.byLead(leadId)
    : queryKeys.activities.all;

  const create = useMutation({
    mutationFn: (input: ActivityInput) => createActivityAction(input),
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey });
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(leadId) });
      }
      toast.success("Actividad registrada", {
        description: activity.subject,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("No se pudo registrar la actividad");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: (id: string) => toggleActivityStatusAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Activity[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<Activity[]>(
          queryKey,
          previous.map((activity) =>
            activity.id === id
              ? {
                  ...activity,
                  status:
                    activity.status === "completada"
                      ? "pendiente"
                      : "completada",
                }
              : activity
          )
        );
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      console.error(error);
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("No se pudo actualizar la actividad");
    },
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey });
      if (activity.lead_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(activity.lead_id) });
      }
      toast.success("Actividad actualizada");
    },
  });

  return { create, toggleStatus };
}
