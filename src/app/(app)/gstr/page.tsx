import { Suspense } from "react";
import { GitMerge } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GSTRPageClient } from "@/components/gstr/GSTRPageClient";
import { MismatchTableSkeleton } from "@/components/gstr/MismatchTable";
import { Skeleton } from "@/components/ui/skeleton";
import type { GSTR2BEntry, Invoice } from "@/types";

async function GSTRData() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch GSTR-2B entries
  const { data: gstrData } = await supabase
    .from("gstr2b_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const entries = (gstrData ?? []) as GSTR2BEntry[];

  // Fetch associated invoices
  const invoiceIds = entries
    .map((e) => e.matched_invoice_id)
    .filter((id): id is string => id !== null);

  const invoiceMap: Record<string, Invoice> = {};

  if (invoiceIds.length > 0) {
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*")
      .in("id", invoiceIds);

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

  const summary = {
    total: entries.length,
    matched,
    unmatched,
    discrepancy,
    potentialITCLoss,
  };

  return (
    <GSTRPageClient
      initialEntries={entries}
      initialInvoiceMap={invoiceMap}
      initialSummary={summary}
    />
  );
}

function GSTRSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <MismatchTableSkeleton />
    </div>
  );
}

export default function GSTRPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center flex-shrink-0">
          <GitMerge className="h-5 w-5 text-saffron-600" />
        </div>
        <div>
          <h1
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            GSTR-2B Reconciliation
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Match your purchase invoices with GSTR-2B to claim maximum ITC.
          </p>
        </div>
      </div>

      {/* Main content */}
      <Suspense fallback={<GSTRSkeleton />}>
        <GSTRData />
      </Suspense>
    </div>
  );
}
