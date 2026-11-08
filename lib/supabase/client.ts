"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

let client: SupabaseClient<Database> | undefined;

export function createSupabaseBrowserClient() {
  if (!client) {
    const { url, key } = getSupabaseConfig();
    client = createBrowserClient<Database>(url, key);
  }
  return client;
}
