"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Download, FileCode2, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import type { SubscriptionPlan } from "@/types";

interface ExportDropdownProps {
  userPlan: SubscriptionPlan;
}

function defaultDateRange(): { from: string; to: string } {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const fmt = (d: Date) => d.toISOString().split("T")[0] as string;
  return { from: fmt(firstDay), to: fmt(today) };
}

async function triggerDownload(
  url: string,
  defaultFilename: string
): Promise<number> {
  const res = await fetch(url, { credentials: "same-origin" });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(json.error ?? `Export failed (${res.status})`);
  }

  const blob = await res.blob();

  // Prefer server-provided filename from Content-Disposition
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? defaultFilename;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);

  // Estimate row count from blob size (rough)
  return Math.max(1, Math.round(blob.size / 200));
}

export function ExportDropdown({ userPlan }: ExportDropdownProps) {
  const isPro = userPlan === "pro" || userPlan === "ca";
  const [open, setOpen] = useState(false);
  const [dates, setDates] = useState(defaultDateRange);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingTally, setLoadingTally] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const buildParams = () =>
    new URLSearchParams({
      dateFrom: dates.from,
      dateTo: dates.to,
    }).toString();

  const handleCSV = async () => {
    setLoadingCSV(true);
    try {
      const count = await triggerDownload(
        `/api/invoice/export/csv?${buildParams()}`,
        "bharatcompliance-invoices.csv"
      );
      setOpen(false);
      toast({
        title: "CSV downloaded",
        description: `Exported ${count} invoices`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoadingCSV(false);
    }
  };

  const handleTally = async () => {
    if (!isPro) return;
    setLoadingTally(true);
    try {
      const count = await triggerDownload(
        `/api/invoice/export/tally?${buildParams()}`,
        "bharatcompliance-tally.xml"
      );
      setOpen(false);
      toast({
        title: "Tally XML downloaded",
        description: `Exported ${count} invoices — import via Gateway → Import Data → Vouchers`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoadingTally(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
          open
            ? "bg-muted border-border text-foreground"
            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Download className="h-4 w-4" />
        Export
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-30 w-72 rounded-xl border bg-popover shadow-lg p-4 space-y-4">
          {/* Date range */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Export date range
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dates.from}
                  onChange={(e) =>
                    setDates((d) => ({ ...d, from: e.target.value }))
                  }
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dates.to}
                  onChange={(e) =>
                    setDates((d) => ({ ...d, to: e.target.value }))
                  }
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div
            className="border-t"
            style={{ borderColor: "hsl(var(--border))" }}
          />

          {/* Actions */}
          <div className="space-y-2">
            {/* CSV — all plans */}
            <button
              onClick={handleCSV}
              disabled={loadingCSV}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-60"
            >
              {loadingCSV ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0" />
              ) : (
                <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <div>
                <p className="text-[13px] font-medium text-foreground leading-none">
                  Download CSV
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  All plans · Opens in Excel
                </p>
              </div>
            </button>

            {/* Tally XML — Pro / CA only */}
            <div className="relative group">
              <button
                onClick={handleTally}
                disabled={loadingTally || !isPro}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                  isPro
                    ? "hover:bg-muted disabled:opacity-60"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                {loadingTally ? (
                  <Loader2 className="h-4 w-4 text-saffron-500 animate-spin flex-shrink-0" />
                ) : isPro ? (
                  <FileCode2 className="h-4 w-4 text-saffron-500 flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div>
                  <p className="text-[13px] font-medium text-foreground leading-none">
                    Export to Tally XML
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isPro
                      ? "TallyPrime import ready"
                      : "Upgrade to Pro to unlock"}
                  </p>
                </div>
              </button>

              {!isPro && (
                <div className="absolute left-0 bottom-full mb-1.5 z-40 hidden group-hover:block w-52 rounded-lg bg-popover border shadow-lg p-2.5 text-[11px] text-muted-foreground leading-relaxed pointer-events-none">
                  Upgrade to{" "}
                  <span className="font-semibold text-saffron-600">
                    Vyapaar Pro
                  </span>{" "}
                  to export invoices directly into TallyPrime.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
