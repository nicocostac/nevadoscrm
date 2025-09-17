import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase env vars are not set");
}

export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
