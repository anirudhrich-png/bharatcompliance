"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, RefreshCw, ChevronDown, ChevronUp, Lock, Zap, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GSTRUploadZone } from "./GSTRUploadZone";
import { MismatchTable } from "./MismatchTable";
import { toast } from "@/components/ui/use-toast";
import type { GSTR2BEntry, Invoice, SubscriptionPlan } from "@/types";

interface UploadResult {
  period: string;
  entriesCount: number;
  totalITC: number;
}

interface MismatchSummary {
  total: number;
  matched: number;
  unmatched: number;
  discrepancy: number;
  potentialITCLoss: number;
}

interface GSTRPageClientProps {
  initialEntries: GSTR2BEntry[];
  initialInvoiceMap: Record<string, Invoice>;
  initialSummary: MismatchSummary;
  userPlan: SubscriptionPlan;
}

export function GSTRPageClient({
  initialEntries,
  initialInvoiceMap,
  initialSummary,
  userPlan,
}: GSTRPageClientProps) {
  const isPaidPlan = userPlan === "pro" || userPlan === "ca";
  const [exportingCSV, setExportingCSV] = useState(false);
  const [entries, setEntries] = useState<GSTR2BEntry[]>(initialEntries);
  const [invoiceMap, setInvoiceMap] =
    useState<Record<string, Invoice>>(initialInvoiceMap);
  const [summary, setSummary] = useState<MismatchSummary>(initialSummary);
  const [isReconciling, setIsReconciling] = useState(false);
  const [showUpload, setShowUpload] = useState(initialEntries.length === 0);

  const refreshMismatches = useCallback(async () => {
    const res = await fetch("/api/gstr/mismatches");
    const json = await res.json() as {
      success: boolean;
      data?: { entries: GSTR2BEntry[]; invoiceMap: Record<string, Invoice>; summary: MismatchSummary };
      error?: string;
    };
    if (json.success && json.data) {
      setEntries(json.data.entries);
      setInvoiceMap(json.data.invoiceMap);
      setSummary(json.data.summary);
    }
  }, []);

  const handleUploadComplete = useCallback(
    async (result: UploadResult) => {
      toast({
        title: "GSTR-2B uploaded",
        description: `${result.entriesCount} entries imported for ${result.period}.`,
        variant: "success",
      });
      setShowUpload(false);
      await refreshMismatches();
    },
    [refreshMismatches]
  );

  const handleReconcile = useCallback(async () => {
    if (!isPaidPlan) {
      toast({
        title: "Pro plan required",
        description: "GSTR reconciliation requires the Vyapaar Pro plan.",
        variant: "destructive",
      });
      return;
    }
    setIsReconciling(true);
    try {
      const res = await fetch("/api/gstr/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json() as { success: boolean; data?: { matched: number; unmatched: number }; error?: string };

      if (!json.success) {
        throw new Error(json.error ?? "Reconciliation failed");
      }

      toast({
        title: "Reconciliation complete",
        description: `${json.data?.matched ?? 0} matched, ${json.data?.unmatched ?? 0} unmatched.`,
        variant: "success",
      });

      await refreshMismatches();
    } catch (err) {
      toast({
        title: "Reconciliation failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsReconciling(false);
    }
  }, [isPaidPlan, refreshMismatches]);

  return (
    <div className="space-y-6">
      {/* Free plan upgrade wall */}
      {!isPaidPlan && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-saffron-200 bg-gradient-to-r from-saffron-50 to-amber-50 p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center flex-shrink-0">
            <Lock className="h-5 w-5 text-saffron-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              GSTR-2B Reconciliation requires Vyapaar Pro
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Upload your GSTR-2B data for free. Unlock reconciliation and ITC matching for ₹199/month.
            </p>
          </div>
          <Link
            href="/settings#billing"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-saffron-500 hover:bg-saffron-600 transition-colors flex-shrink-0"
          >
            <Zap className="h-3.5 w-3.5" />
            Upgrade — ₹199/mo
          </Link>
        </motion.div>
      )}

      {/* Upload toggle */}
      <div className="rounded-xl border bg-card card-warm overflow-hidden">
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center">
              <Upload className="h-4 w-4 text-saffron-600" />
            </div>
            <div className="text-left">
              <p
                className="text-[13px] font-semibold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Upload GSTR-2B
              </p>
              <p className="text-[11px] text-muted-foreground">
                JSON file from the GST portal
              </p>
            </div>
          </div>
          {showUpload ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t px-5 py-5"
          >
            <GSTRUploadZone onUploadComplete={handleUploadComplete} />
          </motion.div>
        )}
      </div>

      {/* Mismatch table */}
      <MismatchTable
        entries={entries}
        invoiceMap={invoiceMap}
        onReconcile={handleReconcile}
        isReconciling={isReconciling}
        summary={summary}
      />

      {/* Export mismatches + reconcile shortcut */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Export mismatches CSV */}
          <button
            onClick={async () => {
              if (!isPaidPlan) {
                toast({
                  title: "Pro plan required",
                  description: "Upgrade to export mismatch data.",
                  variant: "destructive",
                });
                return;
              }
              setExportingCSV(true);
              try {
                const res = await fetch("/api/gstr/export", {
                  credentials: "same-origin",
                });
                if (!res.ok) {
                  const j = (await res.json().catch(() => ({}))) as { error?: string };
                  throw new Error(j.error ?? "Export failed");
                }
                const blob = await res.blob();
                const disposition = res.headers.get("content-disposition") ?? "";
                const match = disposition.match(/filename="([^"]+)"/);
                const filename = match?.[1] ?? "gstr-mismatches.csv";
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast({
                  title: "Exported",
                  description: "GSTR mismatch CSV downloaded — share with your CA for review.",
                  variant: "success",
                });
              } catch (err) {
                toast({
                  title: "Export failed",
                  description: err instanceof Error ? err.message : "Something went wrong",
                  variant: "destructive",
                });
              } finally {
                setExportingCSV(false);
              }
            }}
            disabled={exportingCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {exportingCSV ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Mismatches
          </button>

          <div className="flex items-center gap-3">
          {!isPaidPlan && (
            <Link
              href="/settings#billing"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-saffron-500 hover:bg-saffron-600 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              Unlock reconciliation
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconcile}
            disabled={isReconciling || !isPaidPlan}
            title={!isPaidPlan ? "Requires Vyapaar Pro plan" : undefined}
          >
            {isReconciling ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : !isPaidPlan ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isPaidPlan ? "Refresh data" : "Reconcile (Pro)"}
          </Button>
          </div>
        </div>
      )}
    </div>
  );
}
