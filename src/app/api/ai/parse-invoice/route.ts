import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/server";
import { parseInvoiceFromBase64 } from "@/lib/claude";
import type { ApiResponse, ParsedInvoiceData } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ParsedInvoiceData>>> {
  const { user } = await getSupabaseUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as Record<string, unknown>;

  console.log("[parse-invoice] body keys:", Object.keys(body));
  console.log("[parse-invoice] mimeType:", body.mimeType);
  console.log("[parse-invoice] base64Data length:", typeof body.base64Data === "string" ? body.base64Data.length : undefined);
  console.log("[parse-invoice] imageData length:", typeof body.imageData === "string" ? body.imageData.length : undefined);

  type AllowedMime = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  const ALLOWED_MIMES: AllowedMime[] = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

  // Accept web format (base64Data) and Flutter variants (imageData / image)
  const imageBase64 =
    (typeof body.base64Data === "string" ? body.base64Data : null) ??
    (typeof body.imageData === "string" ? body.imageData : null) ??
    (typeof body.image === "string" ? body.image : null);
  const rawMime = typeof body.mimeType === "string" ? body.mimeType : "";
  const mimeType: AllowedMime = (ALLOWED_MIMES as string[]).includes(rawMime)
    ? (rawMime as AllowedMime)
    : "image/jpeg";

  if (!imageBase64) {
    return NextResponse.json(
      { success: false, error: "Missing image data. Send base64Data, imageData, or image." },
      { status: 400 }
    );
  }

  const { data: invoiceData } = await parseInvoiceFromBase64(imageBase64, mimeType);

  return NextResponse.json({ success: true, data: invoiceData });
}
