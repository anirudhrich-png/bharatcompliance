"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Calendar,
  IndianRupee,
  TrendingUp,
  BadgeCheck,
  Clock,
} from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import { formatCurrency } from "@/lib/utils";
import type { Invoice, ComplianceDate, Profile } from "@/types";

interface ClientDetailClientProps {
  clientUserId: string;
  profile: Pick<Profile, "full_name" | "business_name" | "gstin" | "phone" | "language">;
  invoicesThisMonth: Invoice[];
  recentInvoices: Invoice[];
  complianceDates: ComplianceDate[];
  complianceScore: number;
  pendingMismatches: number;
  totalItcThisMonth: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  prefix = "",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: "saffron" | "red" | "green" | "gold";
  prefix?: string;
}) {
  const colorMap = {
    saffron: "text-saffron-500 bg-saffron-50",
    red: "text-red-500 bg-red-50",
    green: "text-emerald-500 bg-emerald-50",
    gold: "text-amber-500 bg-amber-50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card card-warm p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="font-display text-2xl font-bold text-foreground tabular-nums">
        {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </motion.div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  matched: "text-emerald-700 bg-emerald-50 border-emerald-200",
  mismatch: "text-red-700 bg-red-50 border-red-200",
  missing: "text-gray-600 bg-gray-50 border-gray-200",
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  needs_review: "text-blue-700 bg-blue-50 border-blue-200",
};

export function ClientDetailClient({
  clientUserId,
  profile,
  invoicesThisMonth,
  recentInvoices,
  complianceDates,
  complianceScore,
  pendingMismatches,
  totalItcThisMonth,
}: ClientDetailClientProps) {
  const upcomingDeadlines = complianceDates.filter((d) => d.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/ca"
            className="mt-1 rounded-lg border border-border p-1.5 hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl font-bold text-foreground">
                {profile.business_name}
              </h1>
              <span className="flex items-center gap-1 rounded-full border border-saffron-200 bg-saffron-50 px-2.5 py-0.5 text-[11px] font-semibold text-saffron-700">
                <BadgeCheck className="h-3 w-3" />
                CA View
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile.full_name}
              {profile.gstin && (
                <span className="ml-2 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {profile.gstin}
                </span>
              )}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg self-start">
          Read-only · {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Invoices this month"
          value={invoicesThisMonth.length}
          subtitle="uploaded & parsed"
          icon={FileText}
          color="saffron"
        />
        <StatCard
          title="Pending mismatches"
          value={pendingMismatches}
          subtitle="need attention"
          icon={AlertTriangle}
          color={pendingMismatches > 0 ? "red" : "green"}
        />
        <StatCard
          title="Upcoming deadlines"
          value={upcomingDeadlines}
          subtitle="in next 30 days"
          icon={Calendar}
          color={upcomingDeadlines > 2 ? "gold" : "green"}
        />
        <StatCard
          title="ITC this month"
          value={Math.round(totalItcThisMonth)}
          subtitle="input tax credit"
          icon={IndianRupee}
          color="green"
          prefix="₹"
        />
      </div>

      {/* Compliance health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card card-warm p-5 flex flex-col sm:flex-row items-center gap-6">
          <CircularProgress value={complianceScore} size={110} strokeWidth={9} label="Score" />
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-saffron-500" />
              <h3 className="text-[13px] font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Compliance Health
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              {complianceScore >= 80
                ? "Excellent — all filings are on track."
                : complianceScore >= 60
                ? "Good — a few items need attention."
                : "Needs work — resolve mismatches before filing."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-700">
                {invoicesThisMonth.length} invoices
              </span>
              {pendingMismatches > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 badge-pulse">
                  {pendingMismatches} mismatch{pendingMismatches !== 1 ? "es" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">
            Upcoming deadlines
          </h3>
          {complianceDates.filter((d) => d.status === "pending").length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
          ) : (
            <div className="space-y-2">
              {complianceDates
                .filter((d) => d.status === "pending")
                .slice(0, 4)
                .map((date) => {
                  const daysLeft = Math.ceil(
                    (new Date(date.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={date.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${daysLeft <= 3 ? "bg-red-500" : daysLeft <= 7 ? "bg-amber-500" : "bg-emerald-400"}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{date.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(date.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {daysLeft <= 0 ? "Overdue" : `${daysLeft}d left`}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display text-sm font-semibold text-foreground">Recent invoices</h3>
          <span className="text-xs text-muted-foreground">{recentInvoices.length} shown</span>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {inv.vendor_name ?? "Unknown vendor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.invoice_number ?? "No invoice number"}
                    {inv.invoice_date && ` · ${new Date(inv.invoice_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {inv.total_amount != null ? formatCurrency(inv.total_amount) : "—"}
                  </p>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[inv.status] ?? STATUS_STYLES.pending}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
