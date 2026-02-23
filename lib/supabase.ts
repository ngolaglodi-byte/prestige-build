import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Singleton cache to avoid recreating clients on every call
let browserClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

// Client-side Supabase (anon key, safe for browser)
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  browserClient = createClient(url, anonKey);
  return browserClient;
}

// Server-side Supabase (service role key, server only)
export function getSupabaseServiceClient() {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  serviceClient = createClient(url, serviceKey);
  return serviceClient;
}
