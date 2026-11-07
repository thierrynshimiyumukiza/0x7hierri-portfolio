import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin-access";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the signed-in admin, or null. getUser() asks Supabase to verify the
 * token; getSession() only decodes the cookie, which the client controls.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user && isAdminEmail(user.email) ? user : null;
}

/**
 * Every server action is a public POST endpoint whose id ships in the client
 * bundle, and the actions write through the service-role client that bypasses
 * RLS. This check is the only thing standing between them and the internet, so
 * each exported action has to call it before touching the database.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
