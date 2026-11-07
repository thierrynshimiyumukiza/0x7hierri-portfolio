/**
 * Comma-separated list of the emails allowed into the CMS. It fails closed: with
 * no list configured nobody is an admin, because "any signed-in user" would let
 * anyone who can register through the public anon key edit the site.
 *
 * Kept free of next/headers so the middleware (edge runtime) can import it.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
