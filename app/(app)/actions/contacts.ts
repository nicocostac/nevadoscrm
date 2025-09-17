"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import type { Contact } from "@/lib/types";

export type ContactInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  ownerId: string;
  accountId: string;
};

const CONTACT_SELECT =
  "*, owner:profiles!contacts_owner_id_fkey(id, full_name, email)";

function normalize(value?: string | null) {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createContactAction(input: ContactInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    org_id: orgId,
    name: input.name,
    email: normalize(input.email),
    phone: normalize(input.phone),
    title: normalize(input.title),
    owner_id: input.ownerId,
    account_id: input.accountId,
  };

  const { data, error } = await supabase
    .from("contacts")
    .insert(payload)
    .select(CONTACT_SELECT)
    .single();

  if (error) throw error;

  revalidatePath("/contacts");
  revalidatePath("/leads");

  return data as Contact;
}
