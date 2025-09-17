"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import type { Lead } from "@/lib/types";

export type LeadInput = {
  name: string;
  company?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  ownerId: string;
  stage: Lead["stage"];
  source: Lead["source"];
  value: number;
  notes?: string | null;
  teamId?: string | null;
  accountId: string;
  contactId?: string | null;
};

export type LeadUpdateInput = LeadInput & { id: string };

const LEAD_SELECT =
  "*, owner:profiles!leads_owner_id_fkey(id, full_name, role, email), account:accounts(id, name), contact:contacts(id, name, email, phone)";

function normalizeNullable(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createLeadAction(input: LeadInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    org_id: orgId,
    name: input.name,
    company: normalizeNullable(input.company ?? null),
    title: normalizeNullable(input.title ?? null),
    email: normalizeNullable(input.email ?? null),
    phone: normalizeNullable(input.phone ?? null),
    owner_id: input.ownerId,
    stage: input.stage,
    source: input.source,
    value: input.value,
    notes: normalizeNullable(input.notes ?? null),
    team_id: input.teamId ?? null,
    account_id: input.accountId,
    contact_id: input.contactId ?? null,
    score: null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(payload)
    .select(LEAD_SELECT)
    .single();

  if (error) throw error;

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return data as Lead;
}

export async function updateLeadAction({ id, ...input }: LeadUpdateInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    name: input.name,
    company: normalizeNullable(input.company ?? null),
    title: normalizeNullable(input.title ?? null),
    email: normalizeNullable(input.email ?? null),
    phone: normalizeNullable(input.phone ?? null),
    owner_id: input.ownerId,
    stage: input.stage,
    source: input.source,
    value: input.value,
    notes: normalizeNullable(input.notes ?? null),
    team_id: input.teamId ?? null,
    account_id: input.accountId,
    contact_id: input.contactId ?? null,
    score: null,
  };

  const { data, error } = await supabase
    .from("leads")
    .update(payload)
    .eq("id", id)
    .eq("org_id", orgId)
    .select(LEAD_SELECT)
    .single();

  if (error) throw error;

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/dashboard");

  return data as Lead;
}

export async function deleteLeadAction(id: string) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) throw error;

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
