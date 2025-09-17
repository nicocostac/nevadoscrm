"use server";

import { revalidatePath } from "next/cache";

import { getCurrentOrgId, getCurrentProfile, getServerSupabaseClient } from "@/app/(app)/actions/utils";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export async function updateProfileRoleAction({
  profileId,
  role,
}: {
  profileId: string;
  role: Profile["role"];
}) {
  const { supabase, user } = await getServerSupabaseClient();
  const orgId = await getCurrentOrgId(supabase, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId)
    .eq("org_id", orgId);

  if (error) throw error;

  revalidatePath("/admin");
}

function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export async function inviteUserAction({
  email,
  role,
}: {
  email: string;
  role?: Profile["role"];
}) {
  const { supabase, user } = await getServerSupabaseClient();
  const profile = await getCurrentProfile(supabase, user.id);
  if (profile.role !== "admin") {
    throw new Error("Solo los administradores pueden invitar usuarios");
  }

  const siteUrl = getSiteUrl();
  const { data, error } = await supabaseAdminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  });
  if (error) throw error;

  if (data.user) {
    const updates: Partial<Profile> = { requires_password_reset: true } as Partial<Profile>;
    if (role) {
      updates.role = role;
    }
    await supabaseAdminClient
      .from("profiles")
      .update(updates)
      .eq("id", data.user.id);
  }

  revalidatePath("/admin");
}

export async function updateProfileDetailsAction({
  fullName,
}: {
  fullName: string;
}) {
  const { supabase, user } = await getServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);
  if (error) throw error;
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function updatePasswordAction({ password }: { password: string }) {
  const { supabase } = await getServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .update({ requires_password_reset: false })
      .eq("id", user.id);
  }
}
