import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

function secretMatches(provided: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * On-demand revalidation for webhooks. The secret travels in a header rather
 * than the query string, which ends up in access logs, and it is a dedicated
 * value: this used to compare against the service-role key, so any leak of a
 * webhook URL leaked full database access with it.
 */
export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path") ?? "/";
  if (!path.startsWith("/")) {
    return NextResponse.json({ ok: false, error: "path must start with /" }, { status: 400 });
  }

  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path });
}
