"use client";

import Link from "next/link";
import { FileText, Upload, ChevronRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";

interface RecentActivityProps {
  invoices: Invoice[];
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700",
    pulse: true,
  },
  matched: { label: "Matched", className: "bg-emerald-100 text-emerald-700" },
  mismatch: { label: "Mismatch", className: "bg-red-100 text-red-700" },
  missing: { label: "Missing", className: "bg-gray-100 text-gray-600" },
  needs_review: {
    label: "Review",
    className: "bg-blue-100 text-blue-700",
    pulse: true,
  },
};

export function RecentActivity({ invoices }: RecentActivityProps) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border bg-card card-warm p-5">
        <h3
          className="text-[13px] font-semibold text-foreground mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Recent Invoices
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-saffron-100 flex items-center justify-center mb-3">
            <Upload className="h-5 w-5 text-saffron-500" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            No invoices yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Upload your first invoice to get started
          </p>
          <Link
            href="/invoice/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: "hsl(var(--primary))" }}
          >
            Upload Invoice
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card card-warm overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between">
          <h3
            className="text-[13px] font-semibold text-foreground flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <FileText className="h-4 w-4 text-saffron-500" />
            Recent Invoices
          </h3>
          <Link
            href="/invoice/history"
            className="text-xs text-saffron-600 hover:text-saffron-700 font-medium flex items-center gap-0.5 transition-colors"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <ul className="divide-y divide-border/60">
        {invoices.slice(0, 6).map((invoice, i) => {
          const status = STATUS_CONFIG[invoice.status];
          return (
            <motion.li
              key={invoice.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-saffron-50 border border-saffron-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-saffron-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {invoice.vendor_name ?? invoice.file_name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {invoice.invoice_number
                    ? `#${invoice.invoice_number}`
                    : "—"}
                  {" · "}
                  {formatDate(invoice.invoice_date ?? invoice.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className="text-[13px] font-semibold text-foreground tabular-nums hidden sm:block">
                  {formatCurrency(invoice.total_amount)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${status.className} ${status.pulse ? "badge-pulse" : ""}`}
                >
                  {status.label}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <Skeleton className="h-4 w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}
