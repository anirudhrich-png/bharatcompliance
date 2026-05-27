import type { Metadata } from "next";
import {
  CheckCircle2,
  Brain,
  ShieldCheck,
  Bell,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
};

const FEATURES = [
  {
    icon: Brain,
    title: "AI invoice parsing",
    desc: "Reads Hindi, Tamil, Telugu, Marathi and 5 more languages automatically.",
  },
  {
    icon: CheckCircle2,
    title: "GSTR-2B reconciliation",
    desc: "Match supplier invoices in seconds — spot ITC losses before filing.",
  },
  {
    icon: Bell,
    title: "Never miss a deadline",
    desc: "WhatsApp + email reminders before every GST filing date.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    desc: "256-bit encryption, India-hosted servers, RLS on every row.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col relative overflow-hidden grain"
        style={{ background: "#0f172a" }}
      >
        {/* Decorative blob — soft, contained, not bar-like */}
        <div
          className="absolute top-0 right-0 w-64 h-64 opacity-[0.12] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top right, #f97316 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.07] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at bottom left, #059669 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-9 h-9 rounded-xl bg-saffron-500 flex items-center justify-center flex-shrink-0">
              <span
                className="text-white font-bold text-[13px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                BC
              </span>
            </div>
            <span
              className="text-white font-semibold text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              BharatCompliance
            </span>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center">
            <h1
              className="text-[2.5rem] font-bold text-white leading-[1.15] mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              GST compliance,{" "}
              <span className="text-saffron-400">made simple.</span>
            </h1>
            <p className="text-slate-400 text-[15px] leading-relaxed mb-10 max-w-sm">
              AI-powered invoice parsing and GSTR-2B reconciliation for Indian
              MSMEs. Your CA co-pilot, in your pocket.
            </p>

            {/* Feature list — lucide icons in saffron circles */}
            <ul className="space-y-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-saffron-500/15 border border-saffron-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-saffron-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-100">
                      {title}
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust bar */}
          <div
            className="pt-6 mt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[11px] text-slate-500">
              Trusted by 2,000+ Indian MSMEs · GST-compliant · 256-bit encrypted
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#fefce8]/30">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-saffron-500 flex items-center justify-center">
            <span
              className="text-white font-bold text-sm"
              style={{ fontFamily: "var(--font-display)" }}
            >
              BC
            </span>
          </div>
          <span
            className="font-semibold text-lg text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            BharatCompliance
          </span>
        </div>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
