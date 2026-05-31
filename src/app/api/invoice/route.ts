import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/server";
import { invoiceSaveSchema, invoiceFilterSchema } from "@/lib/validations";
import type { ApiResponse, Invoice } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Invoice>>> {
  const { user, supabase } = await getSupabaseUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body: unknown = await request.json();
  const parsed = invoiceSaveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const confidenceScore =
    (parsed.data.raw_ai_response as Record<string, unknown> | null)?.[
      "confidence_score"
    ];
  const needsReview =
    typeof confidenceScore === "number" && confidenceScore < 0.6;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      ...parsed.data,
      status: needsReview ? "needs_review" : "pending",
    })
    .select()
    .single<Invoice>();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: invoice }, { status: 201 });
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ invoices: Invoice[]; total: number }>>> {
  const { user, supabase } = await getSupabaseUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = invoiceFilterSchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid filter parameters" },
      { status: 400 }
    );
  }

  const { status, dateFrom, dateTo, vendorGstin, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("invoices")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("invoice_date", dateFrom);
  if (dateTo) query = query.lte("invoice_date", dateTo);
  if (vendorGstin) query = query.eq("vendor_gstin", vendorGstin);

  const { data: invoices, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { invoices: (invoices ?? []) as Invoice[], total: count ?? 0 },
  });
}
