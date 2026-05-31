import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/server";
import type {
  ApiResponse,
  GSTR2BEntry,
  Invoice,
  ReconciliationResult,
  ReconciliationDiscrepancy,
} from "@/types";

function parseDateStr(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function absDaysDiff(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ReconciliationResult>>> {
  try {
    const { user, supabase } = await getSupabaseUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Plan enforcement — GSTR reconciliation requires Pro or CA plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single<{ plan: string }>();

    if (!profile || profile.plan === "free") {
      return NextResponse.json(
        {
          success: false,
          error: "GSTR reconciliation requires the Vyapaar Pro plan or higher.",
          code: "PLAN_UPGRADE_REQUIRED",
        },
        { status: 403 }
      );
    }

    // Parse optional period filter
    let period: string | undefined;
    try {
      const body = await request.json() as Record<string, unknown>;
      if (typeof body?.period === "string" && body.period.length > 0) {
        period = body.period;
      }
    } catch {
      // Body is optional — continue without period filter
    }

    // Fetch GSTR-2B entries
    let gstrQuery = supabase
      .from("gstr2b_entries")
      .select("*")
      .eq("user_id", user.id);
    if (period) gstrQuery = gstrQuery.eq("period", period);
    const { data: gstrData, error: gstrError } = await gstrQuery;

    if (gstrError) {
      return NextResponse.json(
        { success: false, error: gstrError.message },
        { status: 500 }
      );
    }

    // Fetch invoices that are not yet matched
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "matched");

    if (invoiceError) {
      return NextResponse.json(
        { success: false, error: invoiceError.message },
        { status: 500 }
      );
    }

    const gstrEntries = (gstrData ?? []) as GSTR2BEntry[];
    const invoices = (invoiceData ?? []) as Invoice[];

    // Build lookup: "vendor_gstin|invoice_number" → Invoice (case-insensitive, trimmed)
    const invoiceMap = new Map<string, Invoice>();
    for (const inv of invoices) {
      if (inv.vendor_gstin && inv.invoice_number) {
        const key = `${inv.vendor_gstin.trim().toUpperCase()}|${inv.invoice_number.trim().toUpperCase()}`;
        invoiceMap.set(key, inv);
      }
    }

    const discrepancies: ReconciliationDiscrepancy[] = [];
    const gstrUpdates: {
      id: string;
      match_status: string;
      matched_invoice_id: string | null;
    }[] = [];
    const invoiceUpdates: { id: string; status: string }[] = [];

    let matchedCount = 0;
    let unmatchedCount = 0;
    let totalItcAvailable = 0;
    let totalItcMatched = 0;

    for (const entry of gstrEntries) {
      const gstrTax =
        (entry.igst ?? 0) + (entry.cgst ?? 0) + (entry.sgst ?? 0);
      totalItcAvailable += gstrTax;

      const key = `${entry.supplier_gstin.trim().toUpperCase()}|${entry.invoice_number.trim().toUpperCase()}`;
      const matchedInvoice = invoiceMap.get(key) ?? null;

      if (!matchedInvoice) {
        unmatchedCount++;
        gstrUpdates.push({
          id: entry.id,
          match_status: "unmatched",
          matched_invoice_id: null,
        });
        discrepancies.push({
          gstr2b_entry: entry,
          matched_invoice: null,
          discrepancy_type: "not_found",
          difference_amount: gstrTax,
        });
        continue;
      }

      // Check amounts
      const invTax =
        (matchedInvoice.igst ?? 0) +
        (matchedInvoice.cgst ?? 0) +
        (matchedInvoice.sgst ?? 0);
      const amountDiff = Math.abs(gstrTax - invTax);
      const amountMismatch = amountDiff > 1;

      // Check dates
      const gstrDate = parseDateStr(entry.invoice_date);
      const invDate = parseDateStr(matchedInvoice.invoice_date);
      const dateMismatch =
        gstrDate !== null &&
        invDate !== null &&
        absDaysDiff(gstrDate, invDate) > 3;

      if (amountMismatch || dateMismatch) {
        gstrUpdates.push({
          id: entry.id,
          match_status: "discrepancy",
          matched_invoice_id: matchedInvoice.id,
        });
        invoiceUpdates.push({ id: matchedInvoice.id, status: "mismatch" });

        discrepancies.push({
          gstr2b_entry: entry,
          matched_invoice: matchedInvoice,
          discrepancy_type: amountMismatch ? "amount_mismatch" : "date_mismatch",
          difference_amount: amountDiff,
        });
      } else {
        matchedCount++;
        totalItcMatched += gstrTax;
        gstrUpdates.push({
          id: entry.id,
          match_status: "matched",
          matched_invoice_id: matchedInvoice.id,
        });
        invoiceUpdates.push({ id: matchedInvoice.id, status: "matched" });
      }
    }

    // Batch update gstr2b_entries
    if (gstrUpdates.length > 0) {
      for (const upd of gstrUpdates) {
        await supabase
          .from("gstr2b_entries")
          .update({
            match_status: upd.match_status,
            matched_invoice_id: upd.matched_invoice_id,
          })
          .eq("id", upd.id);
      }
    }

    // Batch update invoices
    if (invoiceUpdates.length > 0) {
      for (const upd of invoiceUpdates) {
        await supabase
          .from("invoices")
          .update({ status: upd.status })
          .eq("id", upd.id);
      }
    }

    const result: ReconciliationResult = {
      period: period ?? "all",
      total_entries: gstrEntries.length,
      matched: matchedCount,
      unmatched: unmatchedCount,
      discrepancies,
      summary: {
        total_itc_available: totalItcAvailable,
        total_itc_matched: totalItcMatched,
        potential_itc_loss: totalItcAvailable - totalItcMatched,
      },
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
