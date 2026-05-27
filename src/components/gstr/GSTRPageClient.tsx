"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GSTRUploadZone } from "./GSTRUploadZone";
import { MismatchTable } from "./MismatchTable";
import { toast } from "@/components/ui/use-toast";
import type { GSTR2BEntry, Invoice } from "@/types";

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
}

export function GSTRPageClient({
  initialEntries,
  initialInvoiceMap,
  initialSummary,
}: GSTRPageClientProps) {
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
  }, [refreshMismatches]);

  return (
    <div className="space-y-6">
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

      {/* Reconcile shortcut if data exists */}
      {entries.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconcile}
            disabled={isReconciling}
          >
            {isReconciling ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh data
          </Button>
        </div>
      )}
    </div>
  );
}
