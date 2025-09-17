"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import type { Account } from "@/lib/types";

export type AccountInput = {
  name: string;
  ownerId?: string | null;
  industry: string;
  region: string;
  addressLine: string;
  website?: string | null;
};

const ACCOUNT_SELECT = "*, owner:profiles!accounts_owner_id_fkey(id, full_name, email)";

function normalize(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createAccountAction(input: AccountInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    org_id: orgId,
    name: input.name,
    owner_id: input.ownerId ?? user.id,
    industry: normalize(input.industry) ?? "Otro",
    region: normalize(input.region),
    address_line: normalize(input.addressLine),
    health: "saludable",
    website: normalize(input.website),
  };

  const { data, error } = await supabase
    .from("accounts")
    .insert(payload)
    .select(ACCOUNT_SELECT)
    .single();

  if (error) throw error;

  revalidatePath("/accounts");
  revalidatePath("/leads");
  revalidatePath("/dashboard");

  return data as Account;
}
