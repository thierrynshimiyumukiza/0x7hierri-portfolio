import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!secret || secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path") ?? "/";
  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path });
}
