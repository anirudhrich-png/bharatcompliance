import { Suspense } from "react";
import { TrendingUp } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ComplianceAlert } from "@/components/dashboard/ComplianceAlert";
import {
  RecentActivity,
  RecentActivitySkeleton,
} from "@/components/dashboard/RecentActivity";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { Invoice, ComplianceDate } from "@/types";

async function DashboardData() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [{ data: monthInvoices }, { data: allInvoices }, { data: complianceDates }] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", monthStart)
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("compliance_dates")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", now.toISOString().split("T")[0])
        .order("due_date", { ascending: true }),
    ]);

  const invoices = (monthInvoices ?? []) as Invoice[];
  const recent = (allInvoices ?? []) as Invoice[];
  const deadlines = (complianceDates ?? []) as ComplianceDate[];

  const mismatches = invoices.filter(
    (inv) => inv.status === "mismatch" || inv.status === "missing"
  ).length;

  const totalITC = invoices.reduce(
    (sum, inv) => sum + (inv.cgst ?? 0) + (inv.sgst ?? 0) + (inv.igst ?? 0),
    0
  );

  const upcomingDeadlines = deadlines.filter((d) => d.status === "pending").length;
  const complianceScore = Math.max(0, Math.min(100, 100 - mismatches * 15 - upcomingDeadlines * 5));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Stat cards — staggered ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Invoices this month"
          value={invoices.length}
          subtitle="uploaded & parsed"
          iconName="FileText"
          color="saffron"
          delay={0}
        />
        <StatsCard
          title="Pending mismatches"
          value={mismatches}
          subtitle="need attention"
          iconName="AlertTriangle"
          color={mismatches > 0 ? "red" : "green"}
          delay={0.07}
        />
        <StatsCard
          title="Upcoming deadlines"
          value={upcomingDeadlines}
          subtitle="in next 30 days"
          iconName="Calendar"
          color={upcomingDeadlines > 2 ? "gold" : "green"}
          delay={0.14}
        />
        <StatsCard
          title="ITC this month"
          value={Math.round(totalITC)}
          subtitle="input tax credit"
          iconName="IndianRupee"
          color="green"
          prefix="₹"
          delay={0.21}
        />
      </div>

      {/* ── Compliance health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card card-warm p-5 flex flex-col sm:flex-row items-center gap-6">
          <CircularProgress
            value={complianceScore}
            size={110}
            strokeWidth={9}
            label="Score"
          />
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-saffron-500" />
              <h3
                className="text-[13px] font-semibold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
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
                {invoices.length} invoices
              </span>
              {mismatches > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 badge-pulse">
                  {mismatches} mismatch{mismatches !== 1 ? "es" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ComplianceAlert dates={deadlines} />
        </div>
      </div>

      {/* ── Recent activity ── */}
      <RecentActivity invoices={recent} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-36 rounded-xl" />
        <div className="lg:col-span-2">
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
      <RecentActivitySkeleton />
    </div>
  );
}

import { InviteAcceptedBanner } from "@/components/dashboard/InviteAcceptedBanner";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ invite_accepted?: string; ca_name?: string }>;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <InviteAcceptedBannerWrapper searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </>
  );
}

async function InviteAcceptedBannerWrapper({
  searchParams,
}: {
  searchParams: Promise<{ invite_accepted?: string; ca_name?: string }>;
}) {
  const params = await searchParams;
  if (params.invite_accepted !== "true") return null;
  return <InviteAcceptedBanner caName={params.ca_name ?? "Your CA"} />;
}
