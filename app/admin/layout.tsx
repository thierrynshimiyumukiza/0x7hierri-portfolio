import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AdminFormEnhancer from "@/components/admin/AdminFormEnhancer";
import { getAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // middleware.ts is the real gate; this only decides whether to draw the shell.
  const adminUser = await getAdminUser();

  const headerStore = headers();
  const hintedPath =
    headerStore.get("x-pathname") ?? headerStore.get("next-url") ?? headerStore.get("referer") ?? "";

  const isLoginRoute = hintedPath.includes("/admin/login");

  if (!adminUser && !isLoginRoute) {
    redirect("/admin/login");
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  async function signOut() {
    "use server";

    const client = createClient();
    await client.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <AdminShell signOut={signOut} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "/"}>
      <AdminFormEnhancer />
      {children}
    </AdminShell>
  );
}
