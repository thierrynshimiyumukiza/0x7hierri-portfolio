import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AdminFormEnhancer from "@/components/admin/AdminFormEnhancer";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  const headerStore = headers();
  const hintedPath =
    headerStore.get("x-pathname") ?? headerStore.get("next-url") ?? headerStore.get("referer") ?? "";

  const isLoginRoute = hintedPath.includes("/admin/login");

  if (!data.session && !isLoginRoute) {
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
