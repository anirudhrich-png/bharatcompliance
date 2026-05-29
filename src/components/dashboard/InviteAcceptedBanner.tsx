"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

export function InviteAcceptedBanner({ caName }: { caName: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
        >
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
          <p className="flex-1 text-sm font-medium text-emerald-800">
            You&apos;re now connected to{" "}
            <span className="font-bold">{decodeURIComponent(caName)}</span>. They can now view your
            compliance dashboard.
          </p>
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 rounded p-1 hover:bg-emerald-100 transition-colors"
          >
            <X className="h-4 w-4 text-emerald-600" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
