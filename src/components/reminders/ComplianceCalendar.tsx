"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  MessageCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComplianceDate, FilingType, SubscriptionPlan } from "@/types";

interface ComplianceCalendarProps {
  dates: ComplianceDate[];
  onMarkComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSendWhatsApp: (id: string) => Promise<void>;
  userPlan: SubscriptionPlan;
  userPhone: string | null;
}

const FILING_TYPE_CONFIG: Record<
  FilingType,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  "GSTR-1": {
    label: "GSTR-1",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
    borderClass: "border-blue-200",
  },
  "GSTR-3B": {
    label: "GSTR-3B",
    bgClass: "bg-violet-50",
    textClass: "text-violet-700",
    borderClass: "border-violet-200",
  },
  "GSTR-2B": {
    label: "GSTR-2B",
    bgClass: "bg-cyan-50",
    textClass: "text-cyan-700",
    borderClass: "border-cyan-200",
  },
  ITR: {
    label: "ITR",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  TDS: {
    label: "TDS",
    bgClass: "bg-orange-50",
    textClass: "text-orange-700",
    borderClass: "border-orange-200",
  },
  custom: {
    label: "Custom",
    bgClass: "bg-gray-50",
    textClass: "text-gray-600",
    borderClass: "border-gray-200",
  },
};

function daysUntil(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function DueLabel({ days, status }: { days: number; status: string }) {
  if (status === "completed") return null;
  if (days < 0) {
    return (
      <span className="text-[11px] font-semibold text-red-600">
        {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} overdue
      </span>
    );
  }
  if (days === 0) {
    return <span className="text-[11px] font-semibold text-red-600">Due today</span>;
  }
  if (days <= 7) {
    return (
      <span className="text-[11px] font-semibold text-amber-600">
        {days} day{days !== 1 ? "s" : ""} left
      </span>
    );
  }
  return (
    <span className="text-[11px] text-muted-foreground">
      {days} day{days !== 1 ? "s" : ""} left
    </span>
  );
}

interface DateCardProps {
  date: ComplianceDate;
  onMarkComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSendWhatsApp: (id: string) => Promise<void>;
  isPro: boolean;
  userPhone: string | null;
  isSent: boolean;
  index: number;
}

function DateCard({
  date,
  onMarkComplete,
  onDelete,
  onSendWhatsApp,
  isPro,
  userPhone,
  isSent,
  index,
}: DateCardProps) {
  const [sending, setSending] = useState(false);

  const days = daysUntil(date.due_date);
  const filing = FILING_TYPE_CONFIG[date.filing_type] ?? FILING_TYPE_CONFIG.custom;
  const isOverdue = date.status === "overdue" || (date.status === "pending" && days < 0);
  const isUrgent = date.status === "pending" && days >= 0 && days <= 7;
  const isCompleted = date.status === "completed";

  const formattedDate = new Date(date.due_date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handleSend = async () => {
    setSending(true);
    try {
      await onSendWhatsApp(date.id);
    } finally {
      setSending(false);
    }
  };

  // Determine WhatsApp button state
  const showWhatsApp = !isCompleted;
  const canSend = isPro && !!userPhone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "rounded-xl border bg-card card-warm overflow-hidden",
        "flex"
      )}
    >
      {/* Left accent border */}
      <div
        className={cn(
          "w-1 flex-shrink-0",
          isOverdue
            ? "bg-red-500"
            : isUrgent
            ? "bg-amber-400"
            : isCompleted
            ? "bg-emerald-400"
            : "bg-border"
        )}
      />

      <div className="flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                  filing.bgClass,
                  filing.textClass,
                  filing.borderClass
                )}
              >
                {filing.label}
              </span>

              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Done
                </span>
              )}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>

            <p
              className={cn(
                "text-[13px] font-semibold leading-snug",
                isCompleted
                  ? "line-through text-muted-foreground"
                  : isOverdue
                  ? "text-red-700"
                  : "text-foreground"
              )}
            >
              {date.title}
            </p>

            {date.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {date.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
              {!isCompleted && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <DueLabel days={days} status={date.status} />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* WhatsApp send button */}
            {showWhatsApp && (
              <>
                {canSend ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7",
                      isSent
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "text-green-600 hover:bg-green-50 hover:text-green-700"
                    )}
                    onClick={handleSend}
                    disabled={sending || isSent}
                    title={isSent ? "Reminder sent" : "Send WhatsApp reminder"}
                  >
                    {isSent ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : sending ? (
                      <span className="h-3.5 w-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <MessageCircle className="h-3.5 w-3.5" />
                    )}
                  </Button>
                ) : (
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground/40 cursor-not-allowed"
                      disabled
                      title={
                        !isPro
                          ? "Upgrade to Pro for WhatsApp reminders"
                          : "Add phone number in Settings"
                      }
                    >
                      <Lock className="h-3 w-3" />
                    </Button>
                    <div className="absolute right-0 top-8 z-20 hidden group-hover:block w-44 rounded-lg bg-popover border shadow-lg p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                      {!isPro
                        ? "Upgrade to Vyapaar Pro for WhatsApp reminders"
                        : "Add your phone number in Settings"}
                    </div>
                  </div>
                )}
              </>
            )}

            {!isCompleted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => onMarkComplete(date.id)}
                title="Mark complete"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(date.id)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ComplianceCalendar({
  dates,
  onMarkComplete,
  onDelete,
  onSendWhatsApp,
  userPlan,
  userPhone,
}: ComplianceCalendarProps) {
  // Track which IDs have been sent (seed from reminder_sent field)
  const [sentIds, setSentIds] = useState<Set<string>>(
    () => new Set(dates.filter((d) => d.reminder_sent).map((d) => d.id))
  );

  const isPro = userPlan === "pro" || userPlan === "ca";

  const handleSendWhatsApp = async (id: string) => {
    await onSendWhatsApp(id);
    setSentIds((prev) => new Set(prev).add(id));
  };

  if (dates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card card-warm p-12 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-saffron-100 flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-7 w-7 text-saffron-500" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          No compliance dates yet
        </p>
        <p className="text-xs text-muted-foreground">
          Add custom reminders or reload to auto-generate standard GST deadlines.
        </p>
      </motion.div>
    );
  }

  // Group by month
  const grouped = new Map<string, ComplianceDate[]>();
  for (const date of dates) {
    const monthKey = date.due_date.slice(0, 7);
    const existing = grouped.get(monthKey);
    if (existing) {
      existing.push(date);
    } else {
      grouped.set(monthKey, [date]);
    }
  }

  let cardIndex = 0;

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([monthKey, monthDates]) => {
        const [year, month] = monthKey.split("-").map(Number);
        const monthLabel = new Date(year, (month ?? 1) - 1).toLocaleString("en-IN", {
          month: "long",
          year: "numeric",
        });

        return (
          <div key={monthKey}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
              {monthLabel}
            </p>
            <div className="space-y-2">
              {monthDates.map((date) => {
                const idx = cardIndex++;
                return (
                  <DateCard
                    key={date.id}
                    date={date}
                    onMarkComplete={onMarkComplete}
                    onDelete={onDelete}
                    onSendWhatsApp={handleSendWhatsApp}
                    isPro={isPro}
                    userPhone={userPhone}
                    isSent={sentIds.has(date.id)}
                    index={idx}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
