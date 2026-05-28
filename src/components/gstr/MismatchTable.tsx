"use client";

import { motion } from "framer-motion";
import { RefreshCw, AlertTriangle, CheckCircle2, Clock, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatGSTIN } from "@/lib/utils";
import type { GSTR2BEntry, Invoice } from "@/types";

interface MismatchTableProps {
  entries: GSTR2BEntry[];
  invoiceMap: Record<string, Invoice>;
  onReconcile: () => void;
  isReconciling: boolean;
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    discrepancy: number;
    potentialITCLoss: number;
  };
}

const STATUS_CONFIG = {
  matched: {
    label: "Matched",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  unmatched: {
    label: "Unmatched",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  discrepancy: {
    label: "Discrepancy",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: AlertTriangle,
    iconColor: "text-red-500",
  },
  partial_match: {
    label: "Partial Match",
    className: "border-blue-200 bg-blue-50 text-blue-700",
    icon: Clock,
    iconColor: "text-blue-500",
  },
} as const;

function SummaryCard({
  label,
  value,
  sublabel,
  colorClass,
  delay,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  colorClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border bg-card card-warm p-4"
    >
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={cn("text-2xl font-bold tabular-nums", colorClass)}>{value}</p>
      {sublabel && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>
      )}
    </motion.div>
  );
}

export function MismatchTable({
  entries,
  invoiceMap,
  onReconcile,
  isReconciling,
  summary,
}: MismatchTableProps) {
  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card card-warm p-12 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-saffron-100 flex items-center justify-center mx-auto mb-4">
          <IndianRupee className="h-7 w-7 text-saffron-500" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No GSTR-2B data yet</p>
        <p className="text-xs text-muted-foreground">
          Upload your GSTR-2B JSON to start reconciliation.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Entries"
          value={summary.total}
          colorClass="text-foreground"
          delay={0}
        />
        <SummaryCard
          label="Matched"
          value={summary.matched}
          colorClass="text-emerald-600"
          delay={0.05}
        />
        <SummaryCard
          label="Unmatched"
          value={summary.unmatched}
          colorClass="text-amber-600"
          delay={0.1}
        />
        <SummaryCard
          label="Discrepancies"
          value={summary.discrepancy}
          colorClass="text-red-600"
          delay={0.15}
        />
      </div>

      {/* Potential ITC loss */}
      {summary.potentialITCLoss > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3"
        >
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-[13px] text-red-700">
            <span className="font-semibold">Potential ITC at risk: </span>
            {formatCurrency(summary.potentialITCLoss)} — resolve unmatched/discrepant entries before filing.
          </p>
        </motion.div>
      )}

      {/* Reconcile button */}
      <div className="flex justify-end">
        <Button
          variant="saffron"
          onClick={onReconcile}
          disabled={isReconciling}
        >
          {isReconciling ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Running reconciliation…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Run Reconciliation
            </>
          )}
        </Button>
      </div>

      {/* ── Mobile: individual cards ── */}
      <div className="sm:hidden space-y-2">
        <p
          className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          GSTR-2B Entries
        </p>
        {entries.map((entry, i) => {
          const config =
            STATUS_CONFIG[entry.match_status] ?? STATUS_CONFIG.unmatched;
          const StatusIcon = config.icon;
          const matchedInvoice = entry.matched_invoice_id
            ? invoiceMap[entry.matched_invoice_id]
            : null;
          const gstrTax =
            (entry.igst ?? 0) + (entry.cgst ?? 0) + (entry.sgst ?? 0);
          const invTax = matchedInvoice
            ? (matchedInvoice.igst ?? 0) +
              (matchedInvoice.cgst ?? 0) +
              (matchedInvoice.sgst ?? 0)
            : null;
          const diff = invTax !== null ? Math.abs(gstrTax - invTax) : null;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border bg-card card-warm p-4"
            >
              {/* Invoice number + status badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusIcon
                    className={cn("h-4 w-4 flex-shrink-0", config.iconColor)}
                  />
                  <span className="text-[13px] font-semibold text-foreground truncate">
                    {entry.invoice_number}
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold flex-shrink-0",
                    config.className
                  )}
                >
                  {config.label}
                </span>
              </div>

              {/* Supplier GSTIN */}
              <p
                className="text-[11px] text-muted-foreground tracking-wider mb-3"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {formatGSTIN(entry.supplier_gstin)}
              </p>

              {/* Tax figures: 2-col grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    GSTR-2B Tax
                  </p>
                  <p className="text-[13px] font-semibold text-foreground tabular-nums">
                    {formatCurrency(gstrTax)}
                  </p>
                </div>

                {diff !== null && diff > 1 ? (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Difference
                    </p>
                    <p className="text-[13px] font-semibold text-red-600 tabular-nums">
                      {formatCurrency(diff)}
                    </p>
                  </div>
                ) : !matchedInvoice && entry.match_status !== "matched" ? (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      ITC at Risk
                    </p>
                    <p className="text-[13px] font-semibold text-amber-600 tabular-nums">
                      {formatCurrency(gstrTax)}
                    </p>
                  </div>
                ) : invTax !== null ? (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Invoice Tax
                    </p>
                    <p className="text-[13px] font-semibold text-foreground tabular-nums">
                      {formatCurrency(invTax)}
                    </p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Desktop: divide-y list in a single container ── */}
      <div className="hidden sm:block rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <p
            className="text-[13px] font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            GSTR-2B Entries
          </p>
        </div>

        <div className="divide-y overflow-x-auto">
          {entries.map((entry, i) => {
            const config =
              STATUS_CONFIG[entry.match_status] ?? STATUS_CONFIG.unmatched;
            const StatusIcon = config.icon;
            const matchedInvoice = entry.matched_invoice_id
              ? invoiceMap[entry.matched_invoice_id]
              : null;

            const gstrTax =
              (entry.igst ?? 0) + (entry.cgst ?? 0) + (entry.sgst ?? 0);
            const invTax = matchedInvoice
              ? (matchedInvoice.igst ?? 0) +
                (matchedInvoice.cgst ?? 0) +
                (matchedInvoice.sgst ?? 0)
              : null;
            const diff =
              invTax !== null ? Math.abs(gstrTax - invTax) : null;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <StatusIcon
                    className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[13px] font-semibold text-foreground truncate">
                        {entry.invoice_number}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                          config.className
                        )}
                      >
                        {config.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{formatGSTIN(entry.supplier_gstin)}</span>
                      <span>{entry.period}</span>
                      {entry.invoice_date && (
                        <span>
                          {new Date(entry.invoice_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          GSTR-2B Tax
                        </p>
                        <p className="text-[13px] font-semibold text-foreground tabular-nums">
                          {formatCurrency(gstrTax)}
                        </p>
                      </div>

                      {matchedInvoice && invTax !== null && (
                        <>
                          <div>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                              Invoice Tax
                            </p>
                            <p className="text-[13px] font-semibold text-foreground tabular-nums">
                              {formatCurrency(invTax)}
                            </p>
                          </div>

                          {diff !== null && diff > 1 && (
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                Difference
                              </p>
                              <p className="text-[13px] font-semibold text-red-600 tabular-nums">
                                {formatCurrency(diff)}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {!matchedInvoice && entry.match_status !== "matched" && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            ITC at Risk
                          </p>
                          <p className="text-[13px] font-semibold text-amber-600 tabular-nums">
                            {formatCurrency(gstrTax)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MismatchTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b flex gap-3">
            <Skeleton className="h-4 w-4 mt-0.5 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
