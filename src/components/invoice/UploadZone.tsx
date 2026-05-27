"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, FileText, Loader2, X, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};
const MAX_SIZE = 10 * 1024 * 1024;

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  selectedFile: File | null;
  onClear: () => void;
}

export function UploadZone({
  onFileAccepted,
  isUploading,
  uploadProgress,
  selectedFile,
  onClear,
}: UploadZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFileAccepted(accepted[0]);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_SIZE,
      multiple: false,
      disabled: isUploading,
    });

  // ── File selected (ready to upload) ──
  if (selectedFile && !isUploading) {
    const isPDF = selectedFile.type === "application/pdf";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border-2 border-saffron-200 bg-saffron-50 p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-saffron-100 flex items-center justify-center flex-shrink-0">
            {isPDF ? (
              <FileText className="h-6 w-6 text-saffron-600" />
            ) : (
              <FileImage className="h-6 w-6 text-saffron-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(selectedFile.size / 1024).toFixed(0)} KB ·{" "}
              {isPDF ? "PDF Document" : "Image"}
            </p>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-saffron-100 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Uploading / parsing ──
  if (isUploading) {
    const label =
      uploadProgress < 50
        ? "Uploading invoice…"
        : uploadProgress < 85
        ? "AI is reading your invoice…"
        : "Almost done…";

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border-2 border-saffron-200 bg-saffron-50 p-8 text-center"
      >
        <Loader2 className="h-10 w-10 text-saffron-500 animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
        <p className="text-xs text-muted-foreground mb-5">
          Supports Hindi, Tamil, Telugu, Marathi, Gujarati + more
        </p>
        <div className="w-full max-w-xs mx-auto">
          <div className="h-1.5 rounded-full bg-saffron-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-saffron-500"
              initial={{ width: "0%" }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-saffron-600 font-medium mt-1.5 tabular-nums">
            {uploadProgress}%
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Idle drop zone with animated SVG border ──
  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
        isDragActive && !isDragReject && "scale-[1.01]",
        isDragReject && "scale-[0.99]"
      )}
    >
      <input {...getInputProps()} />

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
          stroke={isDragReject ? "#ef4444" : isDragActive ? "#f97316" : "#fdba74"}
          strokeWidth="2"
          strokeDasharray="8 6"
          style={{
            animation: !isDragActive && !isDragReject
              ? "border-dash 1.8s linear infinite"
              : "none",
          }}
        />
      </svg>

      <div
        className={cn(
          "relative px-6 py-12 text-center transition-colors duration-200",
          isDragActive && !isDragReject
            ? "bg-saffron-50"
            : isDragReject
            ? "bg-red-50"
            : "bg-amber-50/40 hover:bg-saffron-50/60"
        )}
      >
        <AnimatePresence mode="wait">
          {isDragReject ? (
            <motion.div
              key="reject"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm font-semibold text-red-600">File not supported</p>
              <p className="text-xs text-muted-foreground mt-1">JPG · PNG · WebP · PDF only, max 10 MB</p>
            </motion.div>
          ) : isDragActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-14 h-14 rounded-2xl bg-saffron-500 flex items-center justify-center mx-auto mb-4"
                animate={{ y: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              >
                <CloudUpload className="h-7 w-7 text-white" />
              </motion.div>
              <p className="text-sm font-semibold text-saffron-700">Drop it here!</p>
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
                Drag & drop your invoice, or{" "}
                <span className="text-saffron-600 underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                JPG · PNG · WebP · PDF · Max 10 MB
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {["Hindi", "Tamil", "Telugu", "Marathi", "English", "+4 more"].map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-saffron-100 text-saffron-600"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
