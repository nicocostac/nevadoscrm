import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getServerSupabaseClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("No authenticated user");
  return { supabase, user } as const;
}

export async function getCurrentProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getCurrentOrgId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const profile = await getCurrentProfile(supabase, userId);
  if (!profile?.org_id) {
    throw new Error("El perfil no tiene organización asignada");
  }
  return profile.org_id;
}
