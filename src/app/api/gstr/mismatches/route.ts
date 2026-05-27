import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiResponse, GSTR2BEntry, Invoice } from "@/types";

interface MismatchesData {
  entries: GSTR2BEntry[];
  invoiceMap: Record<string, Invoice>;
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    discrepancy: number;
    potentialITCLoss: number;
  };
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<MismatchesData>>> {
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

    const period = request.nextUrl.searchParams.get("period");

    let gstrQuery = supabase
      .from("gstr2b_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (period) {
      gstrQuery = gstrQuery.eq("period", period);
    }

    const { data: gstrData, error: gstrError } = await gstrQuery;

    if (gstrError) {
      return NextResponse.json(
        { success: false, error: gstrError.message },
        { status: 500 }
      );
    }

    const entries = (gstrData ?? []) as GSTR2BEntry[];

    // Collect all matched_invoice_ids
    const invoiceIds = entries
      .map((e) => e.matched_invoice_id)
      .filter((id): id is string => id !== null);

    let invoiceMap: Record<string, Invoice> = {};

    if (invoiceIds.length > 0) {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .in("id", invoiceIds);

      if (invoiceError) {
        return NextResponse.json(
          { success: false, error: invoiceError.message },
          { status: 500 }
        );
      }

      for (const inv of (invoiceData ?? []) as Invoice[]) {
        invoiceMap[inv.id] = inv;
      }
    }

    // Compute summary
    let matched = 0;
    let unmatched = 0;
    let discrepancy = 0;
    let potentialITCLoss = 0;

    for (const entry of entries) {
      const tax = (entry.igst ?? 0) + (entry.cgst ?? 0) + (entry.sgst ?? 0);
      if (entry.match_status === "matched") {
        matched++;
      } else if (entry.match_status === "discrepancy") {
        discrepancy++;
        potentialITCLoss += tax;
      } else {
        unmatched++;
        potentialITCLoss += tax;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        entries,
        invoiceMap,
        summary: {
          total: entries.length,
          matched,
          unmatched,
          discrepancy,
          potentialITCLoss,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
