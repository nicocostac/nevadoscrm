import { LoginClient } from "./login-client";
import { supabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { count, error } = await supabaseAdminClient
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const allowMagicLink = !error && (count ?? 0) === 0;

  return <LoginClient allowMagicLink={allowMagicLink} />;
}
