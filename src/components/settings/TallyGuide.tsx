"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileCode2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    num: "1",
    title: "Download the Tally XML",
    body: 'Go to Invoice History → click "Export" → select date range → click "Export to Tally XML". The file downloads as bharatcompliance-tally-[period].xml.',
  },
  {
    num: "2",
    title: "Open TallyPrime",
    body: "Open TallyPrime on your computer and select your company from the Gateway of Tally.",
  },
  {
    num: "3",
    title: "Navigate to Import Data",
    body: 'Go to Gateway of Tally → Import Data → Vouchers. (Keyboard shortcut: press "I" then "I" from the Gateway.)',
  },
  {
    num: "4",
    title: "Select the XML file",
    body: "Browse to and select the downloaded bharatcompliance-tally-[period].xml file. Tally will preview the number of vouchers to be imported.",
  },
  {
    num: "5",
    title: "Confirm and import",
    body: "Press Enter to confirm. Tally will import all Purchase vouchers. A summary report shows how many were imported successfully.",
  },
  {
    num: "6",
    title: "Verify in Daybook",
    body: "Go to Display → Day Book to verify the imported entries. Check that CGST/SGST/IGST Input ledger entries are correctly posted.",
  },
];

const LEDGER_NOTE = `Before importing, ensure these ledgers exist in your Tally company:
• Purchases @5% / @12% / @18% / @28% (under Purchases)
• CGST Input (under Duties & Taxes → GST)
• SGST Input (under Duties & Taxes → GST)
• IGST Input (under Duties & Taxes → GST)
• Sundry Creditor ledgers for each vendor (under Sundry Creditors)`;

export function TallyGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-saffron-100 flex items-center justify-center flex-shrink-0">
            <FileCode2 className="h-3.5 w-3.5 text-saffron-600" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">
              Tally Integration Guide
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              How to import BharatCompliance invoices into TallyPrime
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-6 pb-6 space-y-5"
              style={{ borderTop: "1px solid hsl(var(--border))" }}
            >
              {/* Steps */}
              <div className="pt-5 space-y-4">
                {STEPS.map((step) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-saffron-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[11px] font-bold text-white">
                        {step.num}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground leading-snug">
                        {step.title}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ledger prerequisite note */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-2">
                  Prerequisite — Ledger Setup
                </p>
                <pre className="text-[11px] text-amber-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {LEDGER_NOTE}
                </pre>
              </div>

              {/* Support link */}
              <a
                href="https://help.tallysolutions.com/tally-prime/import-data/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-saffron-600 hover:text-saffron-700 font-medium transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                TallyPrime official import documentation
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
