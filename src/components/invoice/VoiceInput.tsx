"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square, Loader2, Wand2, RotateCcw } from "lucide-react";
import type { ParsedInvoiceData } from "@/types";

const SUPPORTED_LANGUAGES = [
  { code: "hi", label: "हिंदी", english: "Hindi" },
  { code: "ta", label: "தமிழ்", english: "Tamil" },
  { code: "te", label: "తెలుగు", english: "Telugu" },
  { code: "mr", label: "मराठी", english: "Marathi" },
  { code: "bn", label: "বাংলা", english: "Bengali" },
  { code: "gu", label: "ગુજરાતી", english: "Gujarati" },
] as const;

type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number]["code"];

type VoiceState =
  | { phase: "idle" }
  | { phase: "recording"; startedAt: number }
  | { phase: "processing" }
  | { phase: "transcribed"; transcript: string }
  | { phase: "parsing"; transcript: string }
  | { phase: "error"; message: string; transcript?: string };

interface VoiceInputProps {
  bhashiniEnabled: boolean;
  onParsed: (data: ParsedInvoiceData) => void;
  disabled?: boolean;
}

function RecordingTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  return (
    <span className="tabular-nums text-sm font-mono text-red-600">
      {mins}:{secs}
    </span>
  );
}

export function VoiceInput({ bhashiniEnabled, onParsed, disabled }: VoiceInputProps) {
  const [lang, setLang] = useState<SupportedLang>("hi");
  const [voiceState, setVoiceState] = useState<VoiceState>({ phase: "idle" });
  const [textValue, setTextValue] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const maxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (maxDurationRef.current) {
      clearTimeout(maxDurationRef.current);
      maxDurationRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg;codecs=opus";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size < 1000) {
          setVoiceState({ phase: "error", message: "Recording too short — please try again." });
          return;
        }

        setVoiceState({ phase: "processing" });

        try {
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((s, b) => s + String.fromCharCode(b), "")
          );

          const res = await fetch("/api/bhashini/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: base64, language: lang }),
          });

          const json = (await res.json()) as { success: boolean; data?: { transcript: string }; error?: string };

          if (!json.success || !json.data) {
            throw new Error(json.error ?? "Transcription failed");
          }

          setTextValue(json.data.transcript);
          setVoiceState({ phase: "transcribed", transcript: json.data.transcript });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Transcription failed";
          setVoiceState({ phase: "error", message: msg });
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setVoiceState({ phase: "recording", startedAt: Date.now() });

      // Auto-stop at 30 seconds
      maxDurationRef.current = setTimeout(() => {
        stopRecording();
      }, 30_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      setVoiceState({ phase: "error", message: msg });
    }
  }, [lang, stopRecording]);

  const handleMicClick = useCallback(() => {
    if (!bhashiniEnabled) return;
    if (voiceState.phase === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  }, [bhashiniEnabled, voiceState.phase, startRecording, stopRecording]);

  const handleParse = useCallback(async () => {
    const text = textValue.trim();
    if (!text) return;

    const prevTranscript = voiceState.phase === "transcribed" ? voiceState.transcript : text;
    setVoiceState({ phase: "parsing", transcript: prevTranscript });

    try {
      const selectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
      const res = await fetch("/api/ai/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: selectedLang?.english }),
      });

      const json = (await res.json()) as { success: boolean; data?: ParsedInvoiceData; error?: string };

      if (!json.success || !json.data) {
        throw new Error(json.error ?? "Parsing failed");
      }

      onParsed(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Parsing failed";
      setVoiceState({ phase: "error", message: msg, transcript: prevTranscript });
    }
  }, [textValue, voiceState, lang, onParsed]);

  const handleReset = useCallback(() => {
    stopRecording();
    setVoiceState({ phase: "idle" });
    setTextValue("");
  }, [stopRecording]);

  const isRecording = voiceState.phase === "recording";
  const isProcessing = voiceState.phase === "processing" || voiceState.phase === "parsing";
  const hasTranscript =
    voiceState.phase === "transcribed" ||
    voiceState.phase === "parsing" ||
    voiceState.phase === "error";
  const canParse = textValue.trim().length > 0 && !isProcessing && !isRecording;

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-saffron-100 flex items-center justify-center">
            <Mic className="h-3.5 w-3.5 text-saffron-600" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Describe verbally
          </span>
          {!bhashiniEnabled && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              Coming soon
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as SupportedLang)}
            disabled={isRecording || isProcessing}
            className="text-xs rounded-lg border border-input bg-background px-2 py-1.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-saffron-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} ({l.english})
              </option>
            ))}
          </select>

          {/* Mic button */}
          <div className="relative">
            <motion.button
              type="button"
              onClick={handleMicClick}
              onMouseEnter={() => !bhashiniEnabled && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              disabled={disabled || isProcessing || (!bhashiniEnabled)}
              whileHover={{ scale: bhashiniEnabled && !isProcessing ? 1.05 : 1 }}
              whileTap={{ scale: bhashiniEnabled && !isProcessing ? 0.95 : 1 }}
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isRecording
                  ? "bg-red-500 text-white"
                  : !bhashiniEnabled
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-saffron-500 text-white hover:bg-saffron-600"
              }`}
            >
              {isRecording && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-red-400"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              {isRecording ? (
                <Square className="h-3.5 w-3.5 fill-current" />
              ) : !bhashiniEnabled ? (
                <MicOff className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
            </motion.button>

            {/* Tooltip for disabled state */}
            <AnimatePresence>
              {showTooltip && !bhashiniEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full mt-2 z-50 w-48 rounded-lg bg-popover border shadow-md px-3 py-2"
                >
                  <p className="text-xs font-medium text-foreground">Voice input — Coming soon</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Available on the Vyapaar plan. Type your description below in the meantime.
                  </p>
                  <div className="absolute -top-1.5 right-3 w-3 h-3 rotate-45 bg-popover border-t border-l" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Recording status */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-red-600"
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-red-500 inline-block"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            Recording…{" "}
            <RecordingTimer startedAt={(voiceState as { phase: "recording"; startedAt: number }).startedAt} />
            <span className="text-[10px] text-muted-foreground ml-auto">max 30s</span>
          </motion.div>
        )}
        {voiceState.phase === "processing" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Transcribing audio…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text area — always visible, pre-filled after transcription */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {bhashiniEnabled
            ? "Record or type your invoice description"
            : "Type your invoice description"}
        </label>
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          disabled={isRecording || voiceState.phase === "processing" || voiceState.phase === "parsing"}
          placeholder={
            lang === "hi"
              ? "उदाहरण: Sharma Traders की invoice है, नंबर 1234, दिनांक 15 जनवरी 2024, कुल राशि ₹5000, 18% GST…"
              : lang === "ta"
              ? "எ.கா: Sharma Traders-இடமிருந்து invoice, எண் 1234, தேதி 15 Jan 2024, மொத்தம் ₹5000, 18% GST…"
              : lang === "te"
              ? "ఉదా: Sharma Traders నుండి invoice, నంబర్ 1234, తేది 15 Jan 2024, మొత్తం ₹5000, 18% GST…"
              : "e.g. Invoice from Sharma Traders, number 1234, dated 15 Jan 2024, total ₹5000 with 18% GST…"
          }
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-saffron-400/40 focus:border-saffron-400 disabled:opacity-50 resize-none transition-colors"
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {voiceState.phase === "error" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2"
          >
            {voiceState.message}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {(hasTranscript || textValue) && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}

        <motion.button
          type="button"
          onClick={handleParse}
          disabled={!canParse}
          whileHover={{ scale: canParse ? 1.02 : 1 }}
          whileTap={{ scale: canParse ? 0.97 : 1 }}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canParse ? "hsl(var(--primary))" : undefined,
            backgroundColor: !canParse ? "hsl(var(--muted))" : undefined,
            color: !canParse ? "hsl(var(--muted-foreground))" : "white",
          }}
        >
          {voiceState.phase === "parsing" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Extracting data…
            </>
          ) : (
            <>
              <Wand2 className="h-3.5 w-3.5" />
              Parse invoice from description
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
