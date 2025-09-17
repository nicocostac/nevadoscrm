import { createClient, type User } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Supabase env vars are not set for Playwright tests");
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function waitForProfile(userId: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      return data;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Profile not created");
}

export async function createTestUserFixtures() {
  const timestamp = Date.now();
  const email = `qa-${timestamp}@nevados.dev`;

  const { data: existing } = await supabaseAdmin.auth.admin.getUserByEmail(email);
  let user: User | undefined = existing?.user ?? undefined;

  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }

  if (!user) throw new Error("No se pudo crear el usuario de prueba");

  const profile = await waitForProfile(user.id);

  const accountName = `Cuenta QA ${timestamp}`;
  const { data: account, error: accountError } = await supabaseAdmin
    .from("accounts")
    .insert({
      org_id: profile.org_id,
      name: accountName,
      owner_id: user.id,
      industry: "Tecnología",
    })
    .select("*")
    .single();
  if (accountError) throw accountError;

  await supabaseAdmin
    .from("contacts")
    .insert({
      org_id: profile.org_id,
      account_id: account.id,
      owner_id: user.id,
      name: `Contacto QA ${timestamp}`,
      email: `contact-${timestamp}@nevados.dev`,
      phone: "+56911111111",
      title: "CTO",
    });

  const opportunityName = `Oportunidad QA ${timestamp}`;
  const { data: opportunity, error: opportunityError } = await supabaseAdmin
    .from("opportunities")
    .insert({
      org_id: profile.org_id,
      account_id: account.id,
      owner_id: user.id,
      name: opportunityName,
      amount: 55000,
    })
    .select("id, name, stage")
    .single();
  if (opportunityError) throw opportunityError;

  return {
    email,
    user,
    profile,
    account,
    opportunity,
  } as const;
}

export async function generateMagicLink(email: string, redirectTo: string) {
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    email,
    type: "magiclink",
    options: {
      redirectTo,
    },
  });
  if (error) throw error;
  return data?.properties?.action_link ?? null;
}

export async function fetchLeadIdByName(name: string) {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("name", name)
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}
