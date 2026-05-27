"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Save,
  RotateCcw,
  Upload,
  Cpu,
  Database,
  PartyPopper,
  Mic,
} from "lucide-react";
import { UploadZone } from "@/components/invoice/UploadZone";
import { ParseResult } from "@/components/invoice/ParseResult";
import { VoiceInput } from "@/components/invoice/VoiceInput";
import { useToast } from "@/components/ui/use-toast";
import type { ParsedInvoiceData } from "@/types";

type Step = "idle" | "uploading" | "parsed" | "saving" | "saved";

const STEPS = [
  { key: "uploading", label: "Upload", icon: Upload },
  { key: "parsed", label: "AI Parse", icon: Cpu },
  { key: "saving", label: "Save", icon: Database },
  { key: "saved", label: "Done", icon: CheckCircle2 },
] as const;

type UploadState =
  | { step: "idle" }
  | { step: "uploading"; progress: number; file: File }
  | { step: "parsed"; data: ParsedInvoiceData; fileUrl: string; file: File | null; source: "file" | "voice" }
  | { step: "saving"; data: ParsedInvoiceData; fileUrl: string; file: File | null; source: "file" | "voice" }
  | { step: "saved" };

function StepIndicator({ current }: { current: Step }) {
  const stepOrder: Step[] = ["idle", "uploading", "parsed", "saving", "saved"];
  const currentIndex = stepOrder.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map(({ key, label, icon: Icon }, i) => {
        const stepIndex = stepOrder.indexOf(key as Step) - 1;
        const isDone = currentIndex > stepIndex + 1;
        const isActive = currentIndex === stepIndex + 1;

        return (
          <div key={key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  background: isDone
                    ? "#059669"
                    : isActive
                    ? "#f97316"
                    : "hsl(var(--muted))",
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <Icon
                  className={`h-4 w-4 ${
                    isDone || isActive ? "text-white" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span
                className={`text-[10px] font-medium ${
                  isActive
                    ? "text-saffron-600"
                    : isDone
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <motion.div
                className="w-12 sm:w-20 h-0.5 mb-5 mx-1"
                animate={{
                  background: isDone ? "#059669" : "hsl(var(--border))",
                }}
                transition={{ duration: 0.3, delay: 0.1 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  bhashiniEnabled: boolean;
}

export function InvoiceUploadClient({ bhashiniEnabled }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<UploadState>({ step: "idle" });

  const handleFileAccepted = useCallback(
    async (file: File) => {
      setState({ step: "uploading", progress: 0, file });

      try {
        const progressInterval = setInterval(() => {
          setState((prev) => {
            if (prev.step !== "uploading") return prev;
            return { ...prev, progress: Math.min(prev.progress + 7, 45) };
          });
        }, 250);

        const uploadForm = new FormData();
        uploadForm.append("file", file);
        const uploadRes = await fetch("/api/invoice/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const err = (await uploadRes.json()) as { error?: string };
          throw new Error(err.error ?? "Upload failed");
        }
        const { data: uploadData } = (await uploadRes.json()) as {
          data: { fileUrl: string; fileName: string };
        };

        setState((prev) =>
          prev.step === "uploading" ? { ...prev, progress: 55 } : prev
        );

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () =>
            resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setState((prev) =>
          prev.step === "uploading" ? { ...prev, progress: 70 } : prev
        );

        const parseRes = await fetch("/api/ai/parse-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Data: base64,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
            fileUrl: uploadData.fileUrl,
          }),
        });

        clearInterval(progressInterval);

        if (!parseRes.ok) {
          const err = (await parseRes.json()) as { error?: string };
          throw new Error(err.error ?? "AI parsing failed");
        }

        const { data: parseData } = (await parseRes.json()) as {
          data: ParsedInvoiceData;
        };

        setState({
          step: "parsed",
          data: parseData,
          fileUrl: uploadData.fileUrl,
          file,
          source: "file",
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        toast({ title: "Upload failed", description: message, variant: "destructive" });
        setState({ step: "idle" });
      }
    },
    [toast]
  );

  const handleVoiceParsed = useCallback((data: ParsedInvoiceData) => {
    setState({
      step: "parsed",
      data,
      fileUrl: "voice-input",
      file: null,
      source: "voice",
    });
  }, []);

  const handleSave = async () => {
    if (state.step !== "parsed") return;
    const { data, fileUrl, file, source } = state;
    const parsedState = { data, fileUrl, file, source };
    setState({ step: "saving", data, fileUrl, file, source });

    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: fileUrl,
          file_name: file?.name ?? "Voice Description",
          invoice_number: data.invoice_number,
          invoice_date: data.invoice_date,
          vendor_name: data.vendor_name,
          vendor_gstin: data.vendor_gstin,
          buyer_gstin: data.buyer_gstin,
          taxable_amount: data.subtotal,
          cgst: data.total_cgst,
          sgst: data.total_sgst,
          igst: data.total_igst,
          total_amount: data.total_amount,
          gst_rate: data.line_items[0]?.gst_rate ?? null,
          hsn_code: data.line_items[0]?.hsn_code ?? null,
          raw_ai_response: data,
          language_detected: data.language_detected,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Save failed");
      }

      setState({ step: "saved" });
      setTimeout(() => router.push("/invoice/history"), 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Save failed", description: message, variant: "destructive" });
      setState({ step: "parsed", ...parsedState });
    }
  };

  const handleReset = () => setState({ step: "idle" });
  const currentStep = state.step;

  const isIdle = currentStep === "idle";
  const isParsedOrSaving = currentStep === "parsed" || currentStep === "saving";
  const parsedState = isParsedOrSaving
    ? (state as Extract<UploadState, { step: "parsed" | "saving" }>)
    : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h2
          className="text-xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Upload Invoice
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload an invoice image or describe it verbally — AI extracts all GST data automatically
        </p>
      </div>

      {/* Step indicator (file upload path only) */}
      <AnimatePresence>
        {currentStep !== "idle" && parsedState?.source !== "voice" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <StepIndicator current={currentStep} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice path badge */}
      <AnimatePresence>
        {isParsedOrSaving && parsedState?.source === "voice" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 text-sm text-saffron-700 bg-saffron-50 border border-saffron-200 rounded-xl px-4 py-2.5">
              <Mic className="h-4 w-4 shrink-0" />
              Invoice data extracted from verbal description
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload zone + Voice input (idle state) */}
      <AnimatePresence>
        {isIdle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 mb-6"
          >
            <UploadZone
              onFileAccepted={handleFileAccepted}
              isUploading={false}
              uploadProgress={0}
              selectedFile={null}
              onClear={handleReset}
            />

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] font-medium text-muted-foreground px-1">
                OR
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <VoiceInput
              bhashiniEnabled={bhashiniEnabled}
              onParsed={handleVoiceParsed}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploading state (progress bar) */}
      <AnimatePresence>
        {currentStep === "uploading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <UploadZone
              onFileAccepted={handleFileAccepted}
              isUploading={true}
              uploadProgress={(state as Extract<UploadState, { step: "uploading" }>).progress}
              selectedFile={null}
              onClear={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {currentStep === "saved" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
            >
              <PartyPopper className="h-8 w-8 text-emerald-500" />
            </motion.div>
            <h3
              className="text-lg font-bold text-foreground mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Invoice saved!
            </h3>
            <p className="text-sm text-muted-foreground">
              Redirecting to invoice history…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parse result + actions */}
      <AnimatePresence>
        {isParsedOrSaving && parsedState && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ParseResult
              data={parsedState.data}
              fileName={parsedState.file?.name ?? "Voice Description"}
            />

            <div
              className="flex items-center justify-between gap-3 mt-6 pt-4"
              style={{ borderTop: "1px solid hsl(var(--border))" }}
            >
              <button
                onClick={handleReset}
                disabled={currentStep === "saving"}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
                {parsedState.source === "voice" ? "Try again" : "Upload different file"}
              </button>

              <motion.button
                onClick={handleSave}
                disabled={currentStep === "saving"}
                whileHover={{ scale: currentStep === "saving" ? 1 : 1.02 }}
                whileTap={{ scale: currentStep === "saving" ? 1 : 0.97 }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{
                  background: "hsl(var(--primary))",
                  boxShadow: "0 2px 10px rgba(249,115,22,0.3)",
                }}
              >
                {currentStep === "saving" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Invoice
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle tip cards */}
      {isIdle && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4"
        >
          {[
            { icon: Cpu, title: "AI-powered OCR", desc: "Reads printed and handwritten invoices in any Indian language" },
            { icon: Database, title: "GST extracted", desc: "GSTIN, HSN codes, CGST/SGST/IGST — all automated" },
            { icon: CheckCircle2, title: "Secure & private", desc: "Files stored encrypted. India-based servers. RLS protected." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-4 text-center card-warm"
            >
              <div className="w-9 h-9 rounded-xl bg-saffron-100 flex items-center justify-center mx-auto mb-3">
                <Icon
                  className="text-saffron-600"
                  style={{ width: "18px", height: "18px" }}
                />
              </div>
              <p className="text-[13px] font-semibold text-foreground mb-1">{title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
