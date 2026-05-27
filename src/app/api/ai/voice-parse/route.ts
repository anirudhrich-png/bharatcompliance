import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseInvoiceFromText } from "@/lib/claude";
import type { ApiResponse, ParsedInvoiceData } from "@/types";

const voiceParseSchema = z.object({
  text: z.string().min(1, "Description text is required").max(2000),
  language: z.string().optional(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ParsedInvoiceData>>> {
  try {
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
    const parsed = voiceParseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { text, language } = parsed.data;
    const { data: invoiceData } = await parseInvoiceFromText(text, language);

    return NextResponse.json({ success: true, data: invoiceData });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
