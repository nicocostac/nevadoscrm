import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const cookieOptions: CookieOptions = {
  maxAge: 60 * 60 * 24, // 24h to mirror auth session timebox
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase env vars are not set");
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const headerList = await headers();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          if (!isReadonlyCookieError(error)) throw error;
        }
      },
      remove(name: string, _options: CookieOptions) {
        void _options;
        try {
          cookieStore.delete(name);
        } catch (error) {
          if (!isReadonlyCookieError(error)) throw error;
        }
      },
    },
    headers: () => headerList,
  });
}

function isReadonlyCookieError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("Cookies can only be modified in a Server Action or Route Handler");
}
