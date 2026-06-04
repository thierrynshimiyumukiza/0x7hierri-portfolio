import type { ReactNode } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("navigation")
    .select("label,url,is_external")
    .eq("visible", true)
    .order("display_order", { ascending: true });

  const items =
    (data as Pick<Tables<"navigation">, "label" | "url" | "is_external">[] | null)?.map((item) => ({
      label: item.label,
      url: item.url,
      isExternal: item.is_external,
    })) ?? [];

  const safeItems = error ? [] : items;

  return (
    <div className="site-shell min-h-screen bg-[--bg-base] text-[--text-body]">
      <Navbar items={safeItems} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
