import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GSTR2BEntry, Invoice, Profile } from "@/types";

const BOM = "﻿";

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells
    .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
    .join(",");
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single<Pick<Profile, "plan">>();

    if (!profile || profile.plan === "free") {
      return NextResponse.json(
        {
          success: false,
          error: "GSTR mismatch export requires Vyapaar Pro or CA Partner plan",
          code: "PLAN_REQUIRED",
        },
        { status: 403 }
      );
    }

    const { data: entries, error: entriesError } = await supabase
      .from("gstr2b_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("invoice_date", { ascending: true });

    if (entriesError) {
      return NextResponse.json(
        { success: false, error: entriesError.message },
        { status: 500 }
      );
    }

    const gstrEntries = (entries ?? []) as GSTR2BEntry[];

    // Fetch matched invoices
    const matchedIds = gstrEntries
      .map((e) => e.matched_invoice_id)
      .filter((id): id is string => !!id);

    let invoiceMap: Record<string, Invoice> = {};
    if (matchedIds.length > 0) {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .in("id", matchedIds);

      invoiceMap = Object.fromEntries(
        ((invoices ?? []) as Invoice[]).map((inv) => [inv.id, inv])
      );
    }

    const headers = [
      "Supplier GSTIN",
      "Invoice Number",
      "Invoice Date",
      "Period",
      "GSTR-2B Taxable Amount",
      "GSTR-2B Tax (Total)",
      "GSTR-2B CGST",
      "GSTR-2B SGST",
      "GSTR-2B IGST",
      "Your Invoice Tax",
      "Difference",
      "Status",
      "ITC At Risk",
    ];

    const rows = gstrEntries.map((entry) => {
      const gstrTax =
        (entry.igst ?? 0) + (entry.cgst ?? 0) + (entry.sgst ?? 0);
      const matchedInv = entry.matched_invoice_id
        ? invoiceMap[entry.matched_invoice_id]
        : null;
      const invTax = matchedInv
        ? (matchedInv.igst ?? 0) +
          (matchedInv.cgst ?? 0) +
          (matchedInv.sgst ?? 0)
        : null;
      const diff =
        invTax !== null ? Math.abs(gstrTax - invTax).toFixed(2) : "";
      const itcAtRisk =
        !matchedInv && entry.match_status !== "matched"
          ? gstrTax.toFixed(2)
          : "";

      return csvRow([
        entry.supplier_gstin,
        entry.invoice_number,
        entry.invoice_date,
        entry.period,
        entry.taxable_amount,
        gstrTax.toFixed(2),
        entry.cgst,
        entry.sgst,
        entry.igst,
        invTax !== null ? invTax.toFixed(2) : "",
        diff,
        entry.match_status,
        itcAtRisk,
      ]);
    });

    const csv =
      BOM + [csvRow(headers), ...rows].join("\r\n");

    const today = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bharatcompliance-gstr-mismatches-${today}.csv"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
