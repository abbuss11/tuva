import { createClient } from "@/lib/supabase/server";

/**
 * Vérifie que l'utilisateur courant est authentifié (admin).
 * Retourne l'utilisateur ou null. Les API routes protégées
 * doivent appeler cette fonction et renvoyer 401 si null.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
