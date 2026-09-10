import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type MediaLibraryItem = Pick<
  Tables<"media_library">,
  "id" | "url" | "file_name" | "media_type" | "created_at" | "alt_text"
>;

/** Feeds the media picker inside the admin editors. */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("q") ?? "").trim();
  const type = searchParams.get("type") ?? "";
  const limit = Math.min(120, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "60", 10) || 60));

  const admin = createAdminClient();
  let query = admin
    .from("media_library")
    .select("id,url,file_name,media_type,created_at,alt_text")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type === "image" || type === "video" || type === "pdf" || type === "attachment") {
    query = query.eq("media_type", type);
  }

  if (search) {
    query = query.or(`file_name.ilike.%${search}%,url.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: (data ?? []) as MediaLibraryItem[] });
}
