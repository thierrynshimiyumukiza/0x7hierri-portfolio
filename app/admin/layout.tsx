import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFormEnhancer from "@/components/admin/AdminFormEnhancer";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  const headerStore = headers();
  const hintedPath =
    headerStore.get("x-pathname") ??
    headerStore.get("next-url") ??
    headerStore.get("referer") ??
    "";

  const isLoginRoute = hintedPath.includes("/admin/login");

  if (!data.session && !isLoginRoute) {
    redirect("/admin/login");
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell min-h-screen bg-[--bg-base] text-[--text-body] lg:grid lg:grid-cols-[200px_1fr]">
      <AdminSidebar />
      <div>
        <AdminHeader />
        <AdminFormEnhancer />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
