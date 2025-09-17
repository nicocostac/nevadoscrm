"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import type { Activity } from "@/lib/types";

export type ActivityInput = {
  leadId: string;
  opportunityId?: string | null;
  subject: string;
  notes: string;
  type: Activity["type"];
  priority: Activity["priority"];
  dueDate?: string | null;
  ownerId: string;
};

const activitySelect =
  "*, owner:profiles!activities_owner_id_fkey(id, full_name), lead:leads(id, name), opportunity:opportunities(id, name)";

export async function createActivityAction(input: ActivityInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    org_id: orgId,
    lead_id: input.leadId,
    opportunity_id: input.opportunityId ?? null,
    owner_id: input.ownerId,
    subject: input.subject,
    notes: input.notes,
    type: input.type,
    status: "pendiente" as Activity["status"],
    priority: input.priority,
    due_date: input.dueDate ?? null,
    team_id: null,
  };

  const { data, error } = await supabase
    .from("activities")
    .insert(payload)
    .select(activitySelect)
    .single();

  if (error) throw error;

  await supabase
    .from("leads")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", input.leadId);

  revalidatePath(`/leads/${input.leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return data as Activity;
}

export async function toggleActivityStatusAction(activityId: string) {
  const { supabase, user } = await getServerSupabaseClient();
  await getCurrentOrgId(supabase, user.id);

  const { data: existing, error: fetchError } = await supabase
    .from("activities")
    .select("id, status, lead_id")
    .eq("id", activityId)
    .single();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Actividad no encontrada");

  const isCompleted = existing.status === "completada";
  const updates = {
    status: isCompleted ? "pendiente" : "completada",
    completed_at: isCompleted ? null : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("activities")
    .update(updates)
    .eq("id", activityId)
    .select(activitySelect)
    .single();
  if (error) throw error;

  if (existing.lead_id) {
    await supabase
      .from("leads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", existing.lead_id);
    revalidatePath(`/leads/${existing.lead_id}`);
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return data as Activity;
}
