"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import { replaceOpportunityProductsAction } from "@/app/(app)/actions/opportunity-products";
import type { Opportunity, OpportunityProductInputPayload } from "@/lib/types";

export type OpportunityStageInput = {
  id: string;
  stage: Opportunity["stage"];
};

export type OpportunityInput = {
  name: string;
  accountId: string;
  ownerId: string;
  stage: Opportunity["stage"];
  amount: number;
  probability: number;
  closeDate?: string | null;
  leadId?: string | null;
  teamId?: string | null;
  hasContract?: boolean;
  contractTermMonths?: number | null;
  coverageZone?: string | null;
  serviceType?: string | null;
  products?: OpportunityProductInputPayload[];
};

export type OpportunityUpdateInput = OpportunityInput & { id: string };

const opportunitySelect =
  "*, owner:profiles!opportunities_owner_id_fkey(id, full_name), account:accounts(id, name), lead:leads(id, name)";

function normalize(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function fetchOpportunityBoard() {
  const { supabase } = await getServerSupabaseClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(opportunitySelect)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Opportunity[];
}

export async function updateOpportunityStageAction({ id, stage }: OpportunityStageInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const { data, error } = await supabase
    .from("opportunities")
    .update({ stage })
    .eq("id", id)
    .eq("org_id", orgId)
    .select(opportunitySelect)
    .single();

  if (error) throw error;

  revalidatePath("/opportunities");
  revalidatePath("/dashboard");

  return data as Opportunity;
}

export async function createOpportunityAction(input: OpportunityInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    org_id: orgId,
    name: input.name,
    account_id: input.accountId,
    owner_id: input.ownerId,
    stage: input.stage,
    amount: input.amount,
    probability: Math.min(100, Math.max(0, input.probability)),
    close_date: normalize(input.closeDate ?? null),
    lead_id: input.leadId ?? null,
    team_id: input.teamId ?? null,
    has_contract: input.hasContract ?? null,
    contract_term_months: input.contractTermMonths ?? null,
    coverage_zone: normalize(input.coverageZone ?? null),
    service_type: normalize(input.serviceType ?? null),
  };

  const { data, error } = await supabase
    .from("opportunities")
    .insert(payload)
    .select(opportunitySelect)
    .single();

  if (error) throw error;

  const opportunity = data as Opportunity;

  if (input.products && input.products.length > 0) {
    await replaceOpportunityProductsAction({ opportunityId: opportunity.id, products: input.products });
  }

  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  if (input.leadId) {
    revalidatePath(`/leads/${input.leadId}`);
  }

  return opportunity;
}

export async function updateOpportunityAction({ id, ...input }: OpportunityUpdateInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    name: input.name,
    account_id: input.accountId,
    owner_id: input.ownerId,
    stage: input.stage,
    amount: input.amount,
    probability: Math.min(100, Math.max(0, input.probability)),
    close_date: normalize(input.closeDate ?? null),
    lead_id: input.leadId ?? null,
    team_id: input.teamId ?? null,
    has_contract: input.hasContract ?? null,
    contract_term_months: input.contractTermMonths ?? null,
    coverage_zone: normalize(input.coverageZone ?? null),
    service_type: normalize(input.serviceType ?? null),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("opportunities")
    .update(payload)
    .eq("id", id)
    .eq("org_id", orgId)
    .select(opportunitySelect)
    .single();

  if (error) throw error;

  const opportunity = data as Opportunity;

  if (input.products) {
    await replaceOpportunityProductsAction({ opportunityId: opportunity.id, products: input.products });
  }

  revalidatePath("/opportunities");
  revalidatePath("/dashboard");
  if (input.leadId) {
    revalidatePath(`/leads/${input.leadId}`);
  }

  return opportunity;
}
