import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseInvoiceFromBase64 } from "@/lib/claude";
import { invoiceUploadSchema } from "@/lib/validations";
import type { ApiResponse, ParsedInvoiceData } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ParsedInvoiceData>>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body: unknown = await request.json();
  const parsed = invoiceUploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { base64Data, mimeType } = parsed.data;

  const { data: invoiceData } = await parseInvoiceFromBase64(
    base64Data,
    mimeType
  );

  return NextResponse.json({ success: true, data: invoiceData });
}
