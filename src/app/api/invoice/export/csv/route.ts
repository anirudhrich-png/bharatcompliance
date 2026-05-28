import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateInvoiceCSV } from "@/lib/tally";
import type { Invoice } from "@/types";

const querySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z
    .enum(["pending", "matched", "mismatch", "missing", "needs_review"])
    .optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, status } = parsed.data;

    let query = supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("invoice_date", { ascending: true });

    if (status) query = query.eq("status", status);
    if (dateFrom) query = query.gte("invoice_date", dateFrom);
    if (dateTo) query = query.lte("invoice_date", dateTo);

    const { data: invoices, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const csv = generateInvoiceCSV((invoices ?? []) as Invoice[]);

    let period = "all";
    if (dateFrom && dateTo) {
      period = `${dateFrom.slice(0, 7)}_to_${dateTo.slice(0, 7)}`;
    } else if (dateFrom) {
      period = `from_${dateFrom.slice(0, 7)}`;
    } else if (dateTo) {
      period = `to_${dateTo.slice(0, 7)}`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bharatcompliance-invoices-${period}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
