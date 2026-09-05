import { createBrowserClient } from "@supabase/ssr";

// Client utilisé côté navigateur (pages "use client").
// N'utilise que la clé anon : aucune donnée sensible n'est
// manipulée directement depuis le client, tout passe par les
// API routes qui utilisent la clé service_role.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
