import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/server";
import type { ApiResponse, InvoiceUploadResult } from "@/types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<InvoiceUploadResult>>> {
  try {
    const { user, supabase } = await getSupabaseUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error("[invoice/upload] Failed to parse form data:", e);
      return NextResponse.json(
        { success: false, error: "Invalid multipart form data" },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "File type not supported. Use JPG, PNG, WebP, or PDF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size must be under 10 MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    // Path format: {userId}/{timestamp}-{random}.{ext}
    // Matches the RLS policy: auth.uid()::text = (storage.foldername(name))[1]
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (e) {
      console.error("[invoice/upload] Failed to read file buffer:", e);
      return NextResponse.json(
        { success: false, error: "Failed to read file" },
        { status: 500 }
      );
    }

    const { error: storageError } = await supabase.storage
      .from("invoices")
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error("[invoice/upload] Supabase storage error:", storageError);
      return NextResponse.json(
        { success: false, error: storageError.message },
        { status: 500 }
      );
    }

    // Generate a signed URL (bucket is private; public URL would be inaccessible)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("invoices")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

    if (signedError || !signedData) {
      console.error("[invoice/upload] Failed to create signed URL:", signedError);
      return NextResponse.json(
        { success: false, error: "File uploaded but failed to generate access URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: signedData.signedUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    });
  } catch (e) {
    console.error("[invoice/upload] Unexpected error:", e);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
