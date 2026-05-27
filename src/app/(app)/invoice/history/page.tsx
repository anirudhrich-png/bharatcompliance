"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  RefreshCw,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatGSTIN } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────────

type FilterState = {
  search: string;
  status: InvoiceStatus | "all";
  dateFrom: string;
  dateTo: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; classes: string }
> = {
  pending:      { label: "Pending",      classes: "bg-amber-100 text-amber-700" },
  matched:      { label: "Matched",      classes: "bg-emerald-100 text-emerald-700" },
  mismatch:     { label: "Mismatch",     classes: "bg-red-100 text-red-700" },
  missing:      { label: "Missing",      classes: "bg-gray-100 text-gray-600" },
  needs_review: { label: "Review",       classes: "bg-blue-100 text-blue-700" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function ExpandedDetail({ invoice }: { invoice: Invoice }) {
  const lineItems =
    Array.isArray(invoice.raw_ai_response?.line_items)
      ? invoice.raw_ai_response!.line_items
      : [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="px-5 pb-5 pt-3 border-t border-border/50 bg-muted/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice details */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Invoice Details
            </p>
            <div className="space-y-0 rounded-lg border bg-card overflow-hidden">
              {[
                ["Invoice No.", invoice.invoice_number, true],
                ["Invoice Date", formatDate(invoice.invoice_date), false],
                ["Vendor", invoice.vendor_name, false],
                ["Vendor GSTIN", invoice.vendor_gstin ? formatGSTIN(invoice.vendor_gstin) : null, true],
                ["Buyer GSTIN", invoice.buyer_gstin ? formatGSTIN(invoice.buyer_gstin) : null, true],
                ["Language", invoice.language_detected, false],
              ].map(([label, value, mono]) => (
                <div
                  key={label as string}
                  className="flex items-start justify-between px-4 py-2.5 gap-4"
                  style={{ borderBottom: "1px solid hsl(var(--border) / 0.6)" }}
                >
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex-shrink-0 mt-0.5">
                    {label as string}
                  </span>
                  <span
                    className={`text-[12px] text-right break-all leading-snug ${
                      mono ? "font-mono text-[11px] tracking-wider" : "font-medium"
                    } ${!value ? "text-muted-foreground/50 italic" : "text-foreground"}`}
                  >
                    {(value as string | null) ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tax breakdown */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tax Breakdown
            </p>
            <div className="rounded-lg border bg-card overflow-hidden">
              {[
                ["Subtotal",  formatCurrency(invoice.taxable_amount)],
                ["CGST",      formatCurrency(invoice.cgst)],
                ["SGST",      formatCurrency(invoice.sgst)],
                ["IGST",      formatCurrency(invoice.igst)],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: "1px solid hsl(var(--border) / 0.6)" }}
                >
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {label as string}
                  </span>
                  <span className="text-[12px] font-medium tabular-nums text-foreground">
                    {value as string}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] font-bold text-foreground">Total</span>
                <span
                  className="text-lg font-bold text-foreground tabular-nums"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        {lineItems.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Line Items ({lineItems.length})
            </p>
            <div className="rounded-lg border bg-card overflow-x-auto">
              <table className="w-full text-xs min-w-[480px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    {["Description", "HSN", "GST%", "Taxable", "Total"].map((h) => (
                      <th
                        key={h}
                        className={`py-2.5 px-4 text-[10px] font-medium text-muted-foreground uppercase tracking-wide ${
                          h === "Description" ? "text-left" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-muted/20" : ""}
                      style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}
                    >
                      <td className="py-2 px-4 font-medium text-foreground max-w-[200px] truncate">
                        {item.description}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-muted-foreground text-[11px]">
                        {item.hsn_code ?? "—"}
                      </td>
                      <td className="py-2 px-4 text-right text-muted-foreground">
                        {item.gst_rate}%
                      </td>
                      <td className="py-2 px-4 text-right tabular-nums text-foreground">
                        {formatCurrency(item.taxable_amount)}
                      </td>
                      <td className="py-2 px-4 text-right font-semibold tabular-nums text-foreground">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InvoiceRow({
  invoice,
  onDelete,
}: {
  invoice: Invoice;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(invoice.id);
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <div className="rounded-xl border bg-card card-warm overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-8 h-8 rounded-lg bg-saffron-50 border border-saffron-100 flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-saffron-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">
            {invoice.vendor_name ?? invoice.file_name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {invoice.invoice_number ? `#${invoice.invoice_number} · ` : ""}
            {formatDate(invoice.invoice_date ?? invoice.created_at)}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <span className="text-[13px] font-semibold tabular-nums text-foreground">
            {formatCurrency(invoice.total_amount)}
          </span>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Delete control */}
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-[11px] text-muted-foreground">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting ? "…" : "Yes"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  No
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="trash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete invoice"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </AnimatePresence>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={expanded ? "Collapse" : "Expand details"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile amount + status */}
      <div className="flex items-center gap-2 px-4 pb-3 sm:hidden">
        <span className="text-[13px] font-semibold tabular-nums text-foreground">
          {formatCurrency(invoice.total_amount)}
        </span>
        <StatusBadge status={invoice.status} />
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && <ExpandedDetail invoice={invoice} />}
      </AnimatePresence>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(invoices: Invoice[]) {
  const headers = [
    "Invoice No.", "Invoice Date", "Vendor", "Vendor GSTIN", "Buyer GSTIN",
    "Subtotal", "CGST", "SGST", "IGST", "Total", "Status", "Created At",
  ];
  const rows = invoices.map((inv) => [
    inv.invoice_number ?? "",
    inv.invoice_date ?? "",
    inv.vendor_name ?? "",
    inv.vendor_gstin ?? "",
    inv.buyer_gstin ?? "",
    inv.taxable_amount ?? "",
    inv.cgst ?? "",
    inv.sgst ?? "",
    inv.igst ?? "",
    inv.total_amount ?? "",
    inv.status,
    inv.created_at,
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InvoiceHistoryPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInvoices = useCallback(
    async (f: FilterState, p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (f.status !== "all") params.set("status", f.status);
        if (f.dateFrom) params.set("dateFrom", f.dateFrom);
        if (f.dateTo) params.set("dateTo", f.dateTo);
        params.set("page", String(p));
        params.set("limit", "20");

        const res = await fetch(`/api/invoice?${params}`);
        if (!res.ok) throw new Error("Failed to load invoices");
        const json = (await res.json()) as {
          success: boolean;
          data?: { invoices: Invoice[]; total: number };
        };
        if (json.success && json.data) {
          let list = json.data.invoices;
          // Client-side search filter (vendor name / invoice number)
          if (f.search.trim()) {
            const q = f.search.trim().toLowerCase();
            list = list.filter(
              (inv) =>
                inv.vendor_name?.toLowerCase().includes(q) ||
                inv.invoice_number?.toLowerCase().includes(q) ||
                inv.vendor_gstin?.toLowerCase().includes(q)
            );
          }
          setInvoices(list);
          setTotal(json.data.total);
        }
      } catch {
        toast({ title: "Error", description: "Could not load invoices", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Debounce search; immediate for other filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchInvoices(filters, page), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters, page, fetchInvoices]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/invoice/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      setTotal((t) => t - 1);
      toast({ title: "Deleted", description: "Invoice removed" });
    } catch {
      toast({ title: "Error", description: "Could not delete invoice", variant: "destructive" });
    }
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const hasActiveFilters =
    filters.status !== "all" || filters.dateFrom || filters.dateTo;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Invoice History
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${total} invoice${total !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(invoices)}
            disabled={invoices.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => fetchInvoices(filters, page)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/invoice/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="rounded-xl border bg-card card-warm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendor, invoice number, GSTIN…"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-saffron-50 border-saffron-200 text-saffron-700"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <Separator className="mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      updateFilter("status", e.target.value as FilterState["status"])
                    }
                    className="w-full px-3 py-2 rounded-lg border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition-colors"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="matched">Matched</option>
                    <option value="mismatch">Mismatch</option>
                    <option value="missing">Missing</option>
                    <option value="needs_review">Needs Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    From date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter("dateFrom", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    To date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter("dateTo", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition-colors"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilters((f) => ({ ...f, status: "all", dateFrom: "", dateTo: "" }));
                    setPage(1);
                  }}
                  className="mt-3 text-[11px] font-medium text-saffron-600 hover:text-saffron-700 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Invoice list */}
      {loading ? (
        <HistorySkeleton />
      ) : invoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card card-warm flex flex-col items-center justify-center py-16 text-center px-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-saffron-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-saffron-500" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            {hasActiveFilters || filters.search ? "No invoices match your filters" : "No invoices yet"}
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            {hasActiveFilters || filters.search
              ? "Try adjusting your search or clearing filters"
              : "Upload your first invoice to get started"}
          </p>
          {!(hasActiveFilters || filters.search) && (
            <Link
              href="/invoice/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Upload className="h-4 w-4" />
              Upload Invoice
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {invoices.map((invoice, i) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <InvoiceRow invoice={invoice} onDelete={handleDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-[13px] text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
