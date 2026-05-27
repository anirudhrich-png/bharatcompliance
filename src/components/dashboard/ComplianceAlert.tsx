"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { daysUntilDue, formatDate } from "@/lib/utils";
import type { ComplianceDate } from "@/types";

interface ComplianceAlertProps {
  dates: ComplianceDate[];
}

function urgency(days: number) {
  if (days < 0) return { label: "Overdue", bg: "bg-red-50", border: "border-l-red-500", text: "text-red-700", badge: "bg-red-100 text-red-700", pulse: true };
  if (days === 0) return { label: "Due today", bg: "bg-red-50", border: "border-l-red-500", text: "text-red-700", badge: "bg-red-100 text-red-700", pulse: true };
  if (days <= 3) return { label: `${days}d left`, bg: "bg-amber-50", border: "border-l-amber-400", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", pulse: true };
  if (days <= 7) return { label: `${days}d left`, bg: "bg-yellow-50/60", border: "border-l-yellow-400", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700", pulse: false };
  return { label: `${days}d left`, bg: "bg-emerald-50/40", border: "border-l-emerald-400", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", pulse: false };
}

export function ComplianceAlert({ dates }: ComplianceAlertProps) {
  const upcoming = dates
    .filter((d) => d.status === "pending")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-xl border bg-card card-warm p-5">
        <h3
          className="text-[13px] font-semibold text-foreground mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Upcoming Deadlines
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">All clear!</p>
          <p className="text-xs text-muted-foreground mt-1">No upcoming deadlines</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card card-warm overflow-hidden">
      <div className="px-5 py-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center justify-between">
          <h3
            className="text-[13px] font-semibold text-foreground flex items-center gap-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Clock className="h-4 w-4 text-saffron-500" />
            Upcoming Deadlines
          </h3>
          <Link
            href="/reminders"
            className="text-xs text-saffron-600 hover:text-saffron-700 font-medium flex items-center gap-0.5 transition-colors"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <ul className="divide-y divide-border/60">
        {upcoming.map((date, i) => {
          const days = daysUntilDue(date.due_date);
          const u = urgency(days);

          return (
            <motion.li
              key={date.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2 }}
              className={`flex items-center justify-between px-5 py-3.5 border-l-[3px] ${u.border} transition-colors hover:bg-muted/30`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {days <= 3 ? (
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${u.text}`} />
                ) : (
                  <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {date.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(date.due_date)}
                  </p>
                </div>
              </div>
              <span
                className={`flex-shrink-0 ml-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${u.badge} ${u.pulse ? "badge-pulse" : ""}`}
              >
                {u.label}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
