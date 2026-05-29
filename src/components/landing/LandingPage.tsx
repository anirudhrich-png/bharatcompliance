"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  BarChart3,
  Bell,
  CheckCircle,
  ArrowRight,
  Shield,
  Star,
  Menu,
  X,
  Check,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronDown,
  Globe,
  Zap,
  IndianRupee,
} from "lucide-react";

// ─── Scroll-triggered fade-in wrapper ────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setMobileOpen(false);
            }}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f97316] font-display text-sm font-bold text-white">
              BC
            </div>
            <span className="font-display text-lg font-semibold text-white">
              BharatCompliance
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {[
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Pricing", href: "#pricing" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-500 hover:shadow-orange-500/40"
            >
              Start free
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="rounded-lg p-2 text-slate-300 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 bg-[#0f172a] md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {[
                { label: "Features", href: "#features" },
                { label: "How it works", href: "#how-it-works" },
                { label: "Pricing", href: "#pricing" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-white/20 px-4 py-2.5 text-center text-sm font-medium text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-[#f97316] px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Start free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e293b] shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-400/70" />
        <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
        <div className="h-3 w-3 rounded-full bg-green-400/70" />
        <span className="ml-2 text-xs text-slate-500">BharatCompliance Dashboard</span>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {[
          { label: "Invoices", value: "1,247", color: "text-[#f97316]" },
          { label: "ITC Saved", value: "₹2.3L", color: "text-emerald-400" },
          { label: "Match Rate", value: "98%", color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/5 p-3 text-center">
            <p className={`text-lg font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
      {/* Invoice list preview */}
      <div className="px-4 pb-4">
        <p className="mb-2 text-xs font-medium text-slate-400">Recent Invoices</p>
        <div className="space-y-2">
          {[
            { vendor: "Reliance Industries Ltd", amount: "₹45,200", status: "matched", gst: "18%" },
            { vendor: "Tata Steel Components", amount: "₹1,23,500", status: "mismatch", gst: "12%" },
            { vendor: "Mahindra Suppliers", amount: "₹32,800", status: "matched", gst: "5%" },
          ].map((inv, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
              <div>
                <p className="text-xs font-medium text-slate-200">{inv.vendor}</p>
                <p className="text-xs text-slate-500">GST {inv.gst}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-200">{inv.amount}</p>
                <span
                  className={`text-xs font-medium ${
                    inv.status === "matched"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {inv.status === "matched" ? "✓ Matched" : "⚠ Mismatch"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0f172a] pt-32 pb-24">
      {/* Grain texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />
      {/* Glow orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f97316]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-emerald-500/8 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f97316]/30 bg-[#f97316]/10 px-4 py-1.5 text-sm text-[#f97316]"
          >
            <span>🇮🇳</span>
            <span className="font-medium">Built for Bharat · IndiaAI Mission Aligned</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-6 font-display text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            GST compliance,
            <br />
            <span className="text-[#f97316]">finally simple.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl"
          >
            AI reads your invoices. Matches your GSTR-2B. Reminds you before
            deadlines. In Hindi, Tamil, Telugu and 8 more languages.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mb-8 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-xl bg-[#f97316] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-500 hover:shadow-orange-500/50 hover:-translate-y-0.5"
            >
              Start free — no card needed
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-white/10 hover:border-white/30"
            >
              See how it works
            </a>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mb-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500"
          >
            {["Trusted by 2,000+ MSMEs", "GST-compliant", "256-bit encrypted"].map((t, i) => (
              <span key={t} className="flex items-center gap-1.5">
                {i > 0 && <span className="hidden sm:block">·</span>}
                <CheckCircle size={13} className="text-emerald-500" />
                {t}
              </span>
            ))}
          </motion.div>

          {/* Hero mockup + floating stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="relative w-full max-w-lg"
          >
            {/* Floating stat cards */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 top-8 z-10 hidden rounded-xl border border-white/10 bg-[#1e293b] px-4 py-3 shadow-xl sm:block"
            >
              <p className="text-xs text-slate-400">ITC Saved</p>
              <p className="font-display text-xl font-bold text-emerald-400">₹2.3L</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute -right-4 top-16 z-10 hidden rounded-xl border border-white/10 bg-[#1e293b] px-4 py-3 shadow-xl sm:block"
            >
              <p className="text-xs text-slate-400">Match Accuracy</p>
              <p className="font-display text-xl font-bold text-[#f97316]">98%</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              className="absolute -right-2 bottom-12 z-10 hidden rounded-xl border border-white/10 bg-[#1e293b] px-4 py-3 shadow-xl sm:block"
            >
              <p className="text-xs text-slate-400">Languages</p>
              <p className="font-display text-xl font-bold text-blue-400">10+</p>
            </motion.div>

            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof Bar ─────────────────────────────────────────────────────────
function SocialProofBar() {
  const items = [
    "Kirana stores",
    "Textile traders",
    "Medical suppliers",
    "Construction firms",
    "IT consultants",
    "Restaurant chains",
    "Steel distributors",
    "Pharma retailers",
    "Auto parts dealers",
    "Electronics traders",
  ];

  return (
    <div className="overflow-hidden border-y border-slate-200 bg-white py-5">
      <div className="flex animate-marquee gap-12 whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Problem Section ──────────────────────────────────────────────────────────
function ProblemSection() {
  const problems = [
    {
      icon: <IndianRupee size={22} />,
      stat: "₹25,000/year",
      text: "lost in penalties on average due to manual GST filing errors",
      color: "from-red-500/20 to-red-600/10 border-red-500/20",
      iconColor: "text-red-400",
    },
    {
      icon: <AlertCircle size={22} />,
      stat: "60% of MSMEs",
      text: "can't navigate English accounting software — and miss critical deductions",
      color: "from-orange-500/20 to-orange-600/10 border-orange-500/20",
      iconColor: "text-orange-400",
    },
    {
      icon: <Clock size={22} />,
      stat: "Forever lost",
      text: "Input Tax Credit that you were owed — because GSTR-2B mismatches went unnoticed",
      color: "from-red-600/20 to-red-700/10 border-red-600/20",
      iconColor: "text-red-400",
    },
  ];

  return (
    <section className="bg-[#0f172a] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-14 text-center">
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
            GST compliance shouldn&apos;t cost you sleep
          </h2>
          <p className="mt-4 text-slate-400">
            Every Indian MSME owner faces these problems. Most just accept them.
          </p>
        </FadeIn>

        <div className="grid gap-6 md:grid-cols-3">
          {problems.map((p, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div
                className={`rounded-2xl border bg-gradient-to-br ${p.color} p-6 backdrop-blur-sm`}
              >
                <div className={`mb-4 ${p.iconColor}`}>{p.icon}</div>
                <p className={`mb-2 font-display text-2xl font-bold ${p.iconColor}`}>{p.stat}</p>
                <p className="text-slate-300 leading-relaxed">{p.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
const featureTabs = [
  {
    id: "parse",
    icon: <FileText size={18} />,
    label: "AI Invoice Parsing",
    headline: "Upload any invoice. AI does the rest.",
    description:
      "Photograph a handwritten invoice from a supplier in Surat. Our AI reads it — GSTIN, HSN codes, tax breakdowns — in seconds. Works for PDFs, photos, and scanned documents in any Indian language.",
    bullets: [
      "Extracts GSTIN, amounts, HSN codes automatically",
      "Understands Hindi, Tamil, Telugu & 7 more languages",
      "0.6+ confidence scoring flags low-quality scans",
      "Full raw response stored for audit trail",
    ],
    mockup: (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
            <FileText size={18} className="text-[#f97316]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">INV-2024-4521.jpg</p>
            <p className="text-xs text-slate-400">Parsed in 2.3s · Confidence 94%</p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            ✓ Extracted
          </span>
        </div>
        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          {[
            ["Vendor", "Reliance Industries Ltd"],
            ["GSTIN", "27AAACR5055K1ZC"],
            ["Invoice No.", "RIL-2024-8823"],
            ["Taxable Amount", "₹38,500.00"],
            ["IGST (18%)", "₹6,930.00"],
            ["Total", "₹45,430.00"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-500">{k}</span>
              <span className="font-medium text-slate-800">{v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "gstr",
    icon: <BarChart3 size={18} />,
    label: "GSTR-2B Reconciliation",
    headline: "Know exactly what ITC you're owed.",
    description:
      "Upload your GSTR-2B JSON from the GST portal. We match every entry against your invoices — flagging mismatches in GSTIN, amounts, and dates — so you claim every rupee of Input Tax Credit.",
    bullets: [
      "Auto-matches on GSTIN + invoice number",
      "Flags amount and date discrepancies instantly",
      "ITC loss summary calculated automatically",
      "Export mismatch report as CSV or Tally XML",
    ],
    mockup: (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">GSTR-2B · Dec 2024</p>
          <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            3 mismatches
          </span>
        </div>
        <div className="space-y-2">
          {[
            { supplier: "Tata Steel Ltd", status: "mismatch", diff: "₹2,400 diff" },
            { supplier: "Wipro Hardware", status: "matched", diff: "Perfect match" },
            { supplier: "Bajaj Electricals", status: "missing", diff: "Not in GSTR-2B" },
          ].map((e, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-sm font-medium text-slate-700">{e.supplier}</p>
              <span
                className={`text-xs font-medium ${
                  e.status === "matched"
                    ? "text-emerald-600"
                    : e.status === "mismatch"
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {e.diff}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2">
          <p className="text-xs font-medium text-emerald-700">
            ITC claimable: <span className="font-bold">₹1,14,200</span>
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "reminders",
    icon: <Bell size={18} />,
    label: "Smart Reminders",
    headline: "Never miss a deadline again.",
    description:
      "We pre-populate your GST filing calendar and send WhatsApp reminders in your preferred language before every deadline — GSTR-1, GSTR-3B, TDS, ITR — so you file on time, every time.",
    bullets: [
      "Pre-loaded with all GST compliance dates",
      "WhatsApp reminders in your language",
      "3-day advance alerts for every deadline",
      "Mark complete right from WhatsApp",
    ],
    mockup: (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-800">Compliance Calendar</p>
        <div className="space-y-2">
          {[
            { title: "GSTR-1 Filing", date: "Jan 11", status: "due", days: "3 days" },
            { title: "GSTR-3B Filing", date: "Jan 20", status: "upcoming", days: "12 days" },
            { title: "GSTR-2B Available", date: "Jan 14", status: "upcoming", days: "6 days" },
            { title: "TDS Deposit", date: "Jan 7", status: "overdue", days: "Overdue" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <div
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  item.status === "overdue"
                    ? "bg-red-500"
                    : item.status === "due"
                    ? "bg-orange-500"
                    : "bg-slate-300"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{item.title}</p>
                <p className="text-xs text-slate-400">{item.date}</p>
              </div>
              <span
                className={`text-xs font-medium ${
                  item.status === "overdue"
                    ? "text-red-600"
                    : item.status === "due"
                    ? "text-orange-600"
                    : "text-slate-400"
                }`}
              >
                {item.days}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

function FeaturesSection() {
  const [active, setActive] = useState(0);
  const activeFeature = featureTabs[active];

  return (
    <section id="features" className="bg-[#fefce8] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-14 text-center">
          <h2 className="font-display text-4xl font-bold text-[#0f172a] sm:text-5xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-4 text-slate-500">
            Three powerful features. One affordable platform.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          {/* Tab buttons */}
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {featureTabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  active === i
                    ? "bg-[#f97316] text-white shadow-lg shadow-orange-200"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid items-center gap-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-2"
            >
              <div>
                <h3 className="mb-3 font-display text-2xl font-bold text-[#0f172a]">
                  {activeFeature.headline}
                </h3>
                <p className="mb-6 text-slate-500 leading-relaxed">{activeFeature.description}</p>
                <ul className="space-y-2.5">
                  {activeFeature.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>{activeFeature.mockup}</div>
            </motion.div>
          </AnimatePresence>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Language Section ─────────────────────────────────────────────────────────
function LanguageSection() {
  const langs = [
    { flag: "🇮🇳", name: "Hindi" },
    { flag: "🇮🇳", name: "Tamil" },
    { flag: "🇮🇳", name: "Telugu" },
    { flag: "🇮🇳", name: "Marathi" },
    { flag: "🇮🇳", name: "Bengali" },
    { flag: "🇮🇳", name: "Gujarati" },
    { flag: "🇮🇳", name: "Kannada" },
    { flag: "🇮🇳", name: "Malayalam" },
  ];

  return (
    <section className="relative overflow-hidden py-24">
      {/* Saffron gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.12),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-orange-700">
            <Globe size={14} />
            Multilingual AI
          </div>
          <h2 className="font-display text-4xl font-bold text-[#0f172a] sm:text-5xl">
            Speaks your language
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-slate-500">
            Not just English. BharatCompliance works in the language your
            business runs in — voice input, parsed invoices, and reminders.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex flex-wrap justify-center gap-3">
            {langs.map((lang) => (
              <div
                key={lang.name}
                className="flex items-center gap-2 rounded-full border border-orange-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-shadow hover:shadow-md"
              >
                <span>{lang.flag}</span>
                {lang.name}
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-12 text-center">
          <p className="text-sm text-slate-400">
            Powered by{" "}
            <span className="font-semibold text-slate-600">Bhashini API</span>{" "}
            — India&apos;s national language translation mission
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Upload your invoice",
      desc: "Any format, any language. Photo from your phone, PDF from email, or scanned paper invoice.",
      icon: <FileText size={24} />,
    },
    {
      num: "02",
      title: "AI extracts everything",
      desc: "Claude AI reads GSTIN, amounts, HSN codes, tax breakdowns — in under 3 seconds.",
      icon: <Zap size={24} />,
    },
    {
      num: "03",
      title: "Match with GSTR-2B",
      desc: "Upload your GSTR-2B. Mismatches are flagged instantly. ITC recoverable is calculated.",
      icon: <TrendingUp size={24} />,
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-16 text-center">
          <h2 className="font-display text-4xl font-bold text-[#0f172a] sm:text-5xl">
            Up and running in 3 minutes
          </h2>
          <p className="mt-4 text-slate-500">No training. No accountant needed. Just upload.</p>
        </FadeIn>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-10 hidden h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#f97316]/30 to-transparent md:block" />

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.15}>
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0f172a] text-[#f97316] shadow-xl">
                    {step.icon}
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#f97316] font-display text-xs font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <p className="mb-1 font-mono text-xs font-bold tracking-widest text-[#f97316]">
                    STEP {step.num}
                  </p>
                  <h3 className="mb-3 font-display text-xl font-bold text-[#0f172a]">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────
function PricingSection() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: "Shuruat",
      subtitle: "Free forever",
      monthly: 0,
      annual: 0,
      cta: "Start free",
      ctaHref: "/register",
      highlighted: false,
      features: [
        "10 invoices/month",
        "AI invoice parsing",
        "Compliance calendar",
        "CSV export",
        "Email support",
      ],
      missing: ["GSTR-2B reconciliation", "WhatsApp reminders", "Tally XML export"],
    },
    {
      name: "Vyapaar",
      subtitle: "Most popular",
      monthly: 199,
      annual: Math.round(199 * 12 * 0.8 / 12),
      cta: "Get started",
      ctaHref: "/register",
      highlighted: true,
      features: [
        "Unlimited invoices",
        "AI invoice parsing",
        "GSTR-2B reconciliation",
        "WhatsApp reminders",
        "Tally XML export",
        "GSTR mismatch CSV",
        "Priority support",
      ],
      missing: ["20 client accounts"],
    },
    {
      name: "CA Partner",
      subtitle: "For professionals",
      monthly: 499,
      annual: Math.round(499 * 12 * 0.8 / 12),
      cta: "Get started",
      ctaHref: "/register",
      highlighted: false,
      features: [
        "Everything in Vyapaar",
        "20 client accounts",
        "Bulk reconciliation",
        "Client dashboard",
        "Dedicated support",
        "Custom branding",
      ],
      missing: [],
    },
  ];

  return (
    <section id="pricing" className="bg-[#fefce8] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-4 text-center">
          <h2 className="font-display text-4xl font-bold text-[#0f172a] sm:text-5xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-slate-500">No hidden fees. No per-invoice charges. Cancel anytime.</p>
        </FadeIn>

        {/* Annual toggle */}
        <FadeIn delay={0.1} className="mb-12 flex items-center justify-center gap-3">
          <span className={`text-sm ${!annual ? "text-[#0f172a] font-semibold" : "text-slate-400"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              annual ? "bg-[#f97316]" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                annual ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm ${annual ? "text-[#0f172a] font-semibold" : "text-slate-400"}`}>
            Annual{" "}
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
              Save 20%
            </span>
          </span>
        </FadeIn>

        <div className="grid gap-6 md:grid-cols-3 items-stretch">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1} className="h-full">
              <div
                className={`relative flex flex-col h-full rounded-2xl p-7 ${
                  plan.highlighted
                    ? "bg-[#0f172a] text-white ring-2 ring-[#f97316] shadow-2xl shadow-orange-500/20"
                    : "bg-white border border-slate-200 shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#f97316] px-4 py-1 text-xs font-bold text-white shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <p
                    className={`font-display text-xl font-bold ${
                      plan.highlighted ? "text-white" : "text-[#0f172a]"
                    }`}
                  >
                    {plan.name}
                  </p>
                  <p className={`text-sm ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}>
                    {plan.subtitle}
                  </p>
                  <div className="mt-4 flex items-end gap-1">
                    <span
                      className={`font-display text-4xl font-bold ${
                        plan.highlighted ? "text-white" : "text-[#0f172a]"
                      }`}
                    >
                      {plan.monthly === 0 ? "Free" : `₹${annual ? plan.annual : plan.monthly}`}
                    </span>
                    {plan.monthly > 0 && (
                      <span className={`mb-1 text-sm ${plan.highlighted ? "text-slate-400" : "text-slate-400"}`}>
                        /month
                      </span>
                    )}
                  </div>
                  {annual && plan.monthly > 0 && (
                    <p className="mt-1 text-xs text-emerald-400">
                      Billed ₹{plan.annual * 12}/year
                    </p>
                  )}
                </div>

                <ul className="flex-1 space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <Check
                        size={15}
                        className={plan.highlighted ? "text-emerald-400" : "text-emerald-500"}
                      />
                      <span className={plan.highlighted ? "text-slate-200" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm opacity-40">
                      <X size={15} className={plan.highlighted ? "text-slate-500" : "text-slate-400"} />
                      <span className={plan.highlighted ? "text-slate-400" : "text-slate-400"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  className={`mt-auto block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-[#f97316] text-white hover:bg-orange-500 shadow-lg shadow-orange-500/30"
                      : "border border-slate-200 bg-white text-[#0f172a] hover:bg-slate-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Pehle har mahine mujhe CA ke paas jaana padta tha. Ab main khud apna GSTR-2B match kar leta hoon. Last quarter ₹42,000 ka ITC bachaya!",
      name: "Ramesh Patel",
      role: "Textile Trader",
      city: "Surat, Gujarat",
      stars: 5,
      initial: "R",
    },
    {
      quote:
        "We supply medicines to 200+ clinics. Earlier our team spent 3 days every month on reconciliation. Now it's done in 20 minutes. The mismatch report is a lifesaver.",
      name: "Dr. Kavitha Sundaram",
      role: "Medical Supplier",
      city: "Chennai, Tamil Nadu",
      stars: 5,
      initial: "K",
    },
    {
      quote:
        "Hamari Hindi mein kaam karta hai — yeh sabse badi baat hai. Mere staff ko English nahi aati thi. Ab unhe koi problem nahi. Bahut badhiya product hai!",
      name: "Suresh Gupta",
      role: "Kirana Store Owner",
      city: "Lucknow, Uttar Pradesh",
      stars: 5,
      initial: "S",
    },
  ];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-14 text-center">
          <h2 className="font-display text-4xl font-bold text-[#0f172a] sm:text-5xl">
            What MSMEs are saying
          </h2>
          <p className="mt-4 text-slate-500">Real stories from real Indian businesses.</p>
        </FadeIn>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="relative flex flex-col rounded-2xl border border-slate-100 bg-[#fefce8] p-7 shadow-sm">
                {/* Quote mark */}
                <span className="mb-4 font-display text-6xl leading-none text-[#f97316]/20 font-bold select-none">
                  &ldquo;
                </span>
                <div className="flex mb-4 gap-0.5">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} size={14} className="fill-[#f97316] text-[#f97316]" />
                  ))}
                </div>
                <p className="mb-6 flex-1 text-slate-600 leading-relaxed italic">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] font-display text-sm font-bold text-white">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">{t.name}</p>
                    <p className="text-xs text-slate-400">
                      {t.role} · {t.city}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use Supabase on AWS infrastructure with Row-Level Security — your data is completely isolated from other users. We are GDPR and IT Act 2000 compliant.",
  },
  {
    q: "Which GST filings does it support?",
    a: "BharatCompliance supports GSTR-1, GSTR-3B, and GSTR-2B reconciliation. We pre-populate compliance dates for all standard GST filings and send reminders 3 days before each deadline.",
  },
  {
    q: "Does it work with Tally?",
    a: "Yes! Pro and CA plan users can export invoices as TallyPrime-compatible XML (Purchase vouchers). Simply import the file into Tally — no manual entry needed. We also provide a step-by-step Tally integration guide in the Settings page.",
  },
  {
    q: "What languages are supported?",
    a: "The AI can parse invoices written in Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, and Malayalam — plus English. Voice input is supported for all 8 Indian languages via the Bhashini API.",
  },
  {
    q: "Can my CA use it?",
    a: "Absolutely. The CA Partner plan (₹499/month) lets you manage up to 20 client accounts from a single dashboard. Each client gets their own isolated data — you get a unified view and bulk reconciliation tools.",
  },
  {
    q: "Is there a free trial?",
    a: "The Shuruat plan is free forever — no credit card needed. You get 10 invoice parses per month, compliance calendar, and CSV export. Upgrade anytime to Vyapaar for unlimited invoices and GSTR-2B reconciliation.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-[#fefce8] py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-14 text-center">
          <h2 className="font-display text-4xl font-bold text-[#0f172a] sm:text-5xl">
            Common questions
          </h2>
        </FadeIn>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="font-medium text-[#0f172a]">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 text-slate-400 transition-transform ${
                      open === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-slate-500 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#0f172a] py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#f97316]/15 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <FadeIn>
          <div className="mb-5 flex items-center justify-center gap-3">
            <Shield size={20} className="text-emerald-400" />
            <span className="text-sm text-slate-400">Secure · Compliant · Made in India</span>
          </div>
          <h2 className="mb-6 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Start your free account today
          </h2>
          <p className="mb-10 text-lg text-slate-400">
            Join 2,000+ Indian businesses already saving time on GST compliance.
            Up and running in 3 minutes.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-10 py-4 text-base font-semibold text-white shadow-xl shadow-orange-500/30 transition-all hover:bg-orange-500 hover:shadow-orange-500/50 hover:-translate-y-0.5"
          >
            Create free account
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-sm text-slate-500">No credit card required · Cancel anytime</p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f97316] font-display text-xs font-bold text-white">
                BC
              </div>
              <span className="font-display text-base font-semibold text-[#0f172a]">
                BharatCompliance
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">GST compliance for Bharat</p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <a href="#features" className="hover:text-slate-700">Features</a>
            <a href="#pricing" className="hover:text-slate-700">Pricing</a>
            <Link href="/login" className="hover:text-slate-700">Sign in</Link>
            <Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-700">Terms</Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-8 sm:flex-row">
          <p className="text-sm text-slate-400">
            Made with <span className="text-red-500">❤️</span> in India
          </p>
          <p className="text-sm text-slate-400">© 2026 Crazy rIch Labs</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <FeaturesSection />
      <LanguageSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
