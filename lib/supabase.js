import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser / client-component client. Safe to use in the browser - it only
 * ever carries the public anon key, and every table it touches is guarded
 * by the permissive-but-explicit RLS policies in supabase/schema.sql.
 */
export function getBrowserClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your project's URL + anon key."
    );
  }
  return createClient(url, anonKey);
}

/**
 * Server-only client using the service role key. Never import this from a
 * "use client" file - it bypasses RLS entirely, which is what lets our API
 * routes do things like recompute counters or read across all users safely.
 */
export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase server env vars. Set SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) in .env.local."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
