"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

export function InviteAcceptedBanner({ caName }: { caName: string }) {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(t);
  }, []);

  const decoded = decodeURIComponent(caName);

  const banner = (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -56 }}
          animate={{ y: 0 }}
          exit={{ y: -56 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 overflow-hidden"
          style={{ height: 56, background: "#059669" }}
        >
          {/* Content row */}
          <div className="flex h-full items-center px-4 gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-white/90" />
            <p className="flex-1 text-sm font-semibold text-white leading-snug">
              Connected to{" "}
              <span className="font-bold">{decoded}</span>
              {" "}— they can now monitor your GST compliance
            </p>
            <button
              onClick={() => setVisible(false)}
              className="flex-shrink-0 rounded-lg p-1.5 hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Countdown progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-[3px] bg-white/40"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 10, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Spacer that holds space in normal flow while banner is visible
  const spacer = (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 56 }}
          exit={{ height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          aria-hidden
        />
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return (
    <>
      {createPortal(banner, document.body)}
      {spacer}
    </>
  );
}
