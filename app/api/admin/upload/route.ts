import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type MediaType = Database["public"]["Enums"]["media_type"];

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function sanitizeFileName(name: string) {
  const collapsed = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  return collapsed || "upload.bin";
}

function mediaTypeFor(mimeType: string, fileName: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) return "pdf";
  return "attachment";
}

async function ensureBucketExists(bucket: string) {
  const supabaseAdmin = createAdminClient();
  const { data: existing } = await supabaseAdmin.storage.getBucket(bucket);

  if (existing) {
    if (!existing.public) {
      await supabaseAdmin.storage.updateBucket(bucket, { public: true, fileSizeLimit: "50MB" });
    }
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(bucket, { public: true, fileSizeLimit: "50MB" });

  if (error && !error.message.toLowerCase().includes("already")) {
    throw error;
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const bucket = String(formData.get("bucket") ?? "media").trim() || "media";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Files must be 50MB or smaller" }, { status: 413 });
  }

  const safeName = sanitizeFileName(file.name);
  const filePath = `${Date.now()}-${randomUUID()}-${safeName}`;
  const supabaseAdmin = createAdminClient();

  try {
    await ensureBucketExists(bucket);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage bucket is unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

  // Recording the upload is what makes it show up in the media picker later.
  await supabaseAdmin.from("media_library").insert({
    url: data.publicUrl,
    bucket,
    file_name: file.name,
    file_size: file.size,
    media_type: mediaTypeFor(file.type ?? "", file.name),
    is_url_mode: false,
  });

  return NextResponse.json({ url: data.publicUrl, fileName: file.name, size: file.size });
}
