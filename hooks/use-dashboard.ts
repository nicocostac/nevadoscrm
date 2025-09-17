"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";
import { useSupabaseClient } from "@/lib/supabase/supabase-context";

export type DashboardOverview = {
  newLeads: number;
  pipelineValue: number;
  overdueActivities: number;
  wonThisMonth: number;
};

export function useDashboardOverview() {
  const supabase = useSupabaseClient();

  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: async (): Promise<DashboardOverview> => {
      const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
        supabase.from("leads").select("id, created_at"),
        supabase.from("opportunities").select("stage, amount, close_date"),
        supabase.from("activities").select("status, due_date"),
      ]);

      const leads = leadsResult.data ?? [];
      const opportunities = opportunitiesResult.data ?? [];
      const activities = activitiesResult.data ?? [];

      if (leadsResult.error) throw leadsResult.error;
      if (opportunitiesResult.error) throw opportunitiesResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const newLeads = leads.filter((lead) => new Date(lead.created_at) >= sevenDaysAgo).length;

      const pipelineValue = opportunities
        .filter((opportunity) =>
          opportunity.stage !== 'Cerrado Ganado' &&
          opportunity.stage !== 'Cerrado Perdido'
        )
        .reduce((sum, opportunity) => sum + (opportunity.amount ?? 0), 0);

      const overdueActivities = activities.filter((activity) => {
        if (activity.status === 'completada' || !activity.due_date) return false;
        const due = new Date(activity.due_date);
        return due < today;
      }).length;

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const wonThisMonth = opportunities
        .filter(
          (opportunity) =>
            opportunity.stage === 'Cerrado Ganado' &&
            opportunity.close_date &&
            new Date(opportunity.close_date) >= startOfMonth
        )
        .reduce((sum, opportunity) => sum + (opportunity.amount ?? 0), 0);

      return {
        newLeads,
        pipelineValue,
        overdueActivities,
        wonThisMonth,
      };
    },
  });
}
