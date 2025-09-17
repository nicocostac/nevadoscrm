"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import type { Attachment } from "@/lib/types";

export type RegisterAttachmentInput = {
  leadId: string;
  opportunityId?: string | null;
  activityId?: string | null;
  storagePath: string;
  fileName: string;
  contentType?: string | null;
  fileSize?: number | null;
};

export async function registerAttachmentAction(input: RegisterAttachmentInput) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const payload = {
    org_id: orgId,
    lead_id: input.leadId,
    opportunity_id: input.opportunityId ?? null,
    activity_id: input.activityId ?? null,
    storage_path: input.storagePath,
    file_name: input.fileName,
    content_type: input.contentType ?? null,
    file_size: input.fileSize ?? null,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("attachments")
    .insert(payload)
    .select("*, created_by:profiles!attachments_created_by_fkey(id, full_name, email)")
    .single();

  if (error) throw error;

  revalidatePath(`/leads/${input.leadId}`);

  return data as Attachment;
}
