import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export async function getSeoMetadata(pageKey: string): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("seo_settings")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle();

  const seo = (data as Tables<"seo_settings"> | null) ?? null;

  return {
    title: seo?.meta_title ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri",
    description: seo?.meta_description ?? undefined,
    keywords: seo?.keywords ?? undefined,
    robots: seo?.robots ?? undefined,
    alternates: seo?.canonical_url
      ? {
          canonical: seo.canonical_url,
        }
      : undefined,
    openGraph: {
      title: seo?.meta_title ?? process.env.NEXT_PUBLIC_SITE_NAME ?? "0x7hierri",
      description: seo?.meta_description ?? undefined,
      images: seo?.og_image_url ? [seo.og_image_url] : [],
    },
  };
}
