"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileJson, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface UploadResult {
  period: string;
  entriesCount: number;
  totalITC: number;
}

interface GSTRUploadZoneProps {
  onUploadComplete: (result: UploadResult) => void;
}

function getLast6Months(): { label: string; value: string }[] {
  const months: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const value = `${year}-${String(month).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
    months.push({ label, value });
  }
  return months;
}

export function GSTRUploadZone({ onUploadComplete }: GSTRUploadZoneProps) {
  const months = getLast6Months();
  const [selectedPeriod, setSelectedPeriod] = useState(months[0]?.value ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [step, setStep] = useState<"idle" | "uploading" | "done">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(file: File) {
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file downloaded from the GST portal.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  async function handleUpload() {
    if (!selectedFile || !selectedPeriod) return;
    setStep("uploading");

    try {
      const text = await selectedFile.text();
      const res = await fetch("/api/gstr/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: selectedPeriod, jsonData: text }),
      });

      const json = await res.json() as { success: boolean; data?: UploadResult; error?: string };

      if (!json.success || !json.data) {
        throw new Error(json.error ?? "Upload failed");
      }

      setStep("done");
      onUploadComplete(json.data);
    } catch (err) {
      setStep("idle");
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
  }

  function reset() {
    setSelectedFile(null);
    setStep("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (step === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          GSTR-2B uploaded successfully
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Run reconciliation to match against your invoices.
        </p>
        <Button variant="saffron-outline" size="sm" onClick={reset}>
          Upload another
        </Button>
      </motion.div>
    );
  }

  if (step === "uploading") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border-2 border-saffron-200 bg-saffron-50 p-8 text-center"
      >
        <Loader2 className="h-10 w-10 text-saffron-500 animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-foreground mb-1">
          Parsing GSTR-2B data…
        </p>
        <p className="text-xs text-muted-foreground">
          Extracting B2B invoice entries
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div>
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
          Filing Period
        </label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={cn(
          "relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
          isDragOver && "scale-[1.01]"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Animated SVG dashed border */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ borderRadius: "0.75rem" }}
        >
          <rect
            x="2"
            y="2"
            width="calc(100% - 4px)"
            height="calc(100% - 4px)"
            rx="10"
            ry="10"
            fill="none"
            stroke={isDragOver ? "#f97316" : "#fdba74"}
            strokeWidth="2"
            strokeDasharray="8 6"
            style={{
              animation: !isDragOver
                ? "border-dash 1.8s linear infinite"
                : "none",
            }}
          />
        </svg>

        <div
          className={cn(
            "relative px-6 py-10 text-center transition-colors duration-200",
            isDragOver ? "bg-saffron-50" : "bg-amber-50/40 hover:bg-saffron-50/60"
          )}
        >
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 rounded-xl bg-saffron-100 flex items-center justify-center flex-shrink-0">
                  <FileJson className="h-6 w-6 text-saffron-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(selectedFile.size / 1024).toFixed(0)} KB · JSON
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="p-1.5 rounded-lg hover:bg-saffron-100 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-saffron-100 flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.05, backgroundColor: "#fed7aa" }}
                  transition={{ duration: 0.15 }}
                >
                  <Upload className="h-6 w-6 text-saffron-500" />
                </motion.div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Drag & drop your GSTR-2B JSON, or{" "}
                  <span className="text-saffron-600 underline underline-offset-2">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Download from GST portal → Returns → GSTR-2B → View / Download
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Upload button */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="saffron"
            className="w-full"
            onClick={handleUpload}
            disabled={!selectedPeriod}
          >
            <Upload className="h-4 w-4" />
            Upload GSTR-2B for{" "}
            {months.find((m) => m.value === selectedPeriod)?.label ?? selectedPeriod}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
