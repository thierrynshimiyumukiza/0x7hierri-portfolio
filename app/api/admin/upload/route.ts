import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function sanitizeFileName(name: string) {
  const collapsed = name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  return collapsed || "upload.bin";
}

async function ensureBucketExists(bucket: string) {
  const supabaseAdmin = createAdminClient();
  const { data: existing } = await supabaseAdmin.storage.getBucket(bucket);

  if (existing) {
    if (!existing.public) {
      await supabaseAdmin.storage.updateBucket(bucket, {
        public: true,
        fileSizeLimit: "50MB",
      });
    }
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "50MB",
  });

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

  const safeName = sanitizeFileName(file.name);
  const filePath = `${Date.now()}-${randomUUID()}-${safeName}`;
  const supabaseAdmin = createAdminClient();

  await ensureBucketExists(bucket);

  const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

  return NextResponse.json({ url: data.publicUrl });
}
