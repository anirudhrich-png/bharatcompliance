"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ComplianceCalendar } from "@/components/reminders/ComplianceCalendar";
import { toast } from "@/components/ui/use-toast";
import type { ComplianceDate, FilingType, Profile } from "@/types";

const FILING_TYPES: FilingType[] = [
  "GSTR-1",
  "GSTR-3B",
  "GSTR-2B",
  "ITR",
  "TDS",
  "custom",
];

interface AddReminderFormData {
  title: string;
  description: string;
  due_date: string;
  filing_type: FilingType;
}

function RemindersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-5 space-y-3">
        <Skeleton className="h-4 w-48" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-1">
          <div className="w-1 rounded bg-muted" />
          <div className="flex-1 rounded-xl border p-4 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface RemindersPageClientProps {
  profile: Profile | null;
}

export function RemindersPageClient({ profile }: RemindersPageClientProps) {
  const [dates, setDates] = useState<ComplianceDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<AddReminderFormData>({
    title: "",
    description: "",
    due_date: "",
    filing_type: "custom",
  });

  const fetchDates = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders");
      const json = await res.json() as { success: boolean; data?: { dates: ComplianceDate[] }; error?: string };
      if (json.success && json.data) {
        setDates(json.data.dates);
      }
    } catch {
      toast({
        title: "Failed to load reminders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDates();
  }, [fetchDates]);

  const handleMarkComplete = useCallback(async (id: string) => {
    setDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "completed" as const } : d))
    );

    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);

      toast({ title: "Marked as completed", variant: "success" });
    } catch {
      void fetchDates();
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }, [fetchDates]);

  const handleDelete = useCallback(async (id: string) => {
    setDates((prev) => prev.filter((d) => d.id !== id));

    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error);

      toast({ title: "Reminder deleted", variant: "success" });
    } catch {
      void fetchDates();
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }, [fetchDates]);

  const handleSendWhatsApp = useCallback(async (id: string): Promise<void> => {
    const res = await fetch("/api/reminders/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId: id }),
    });
    const json = await res.json() as { success: boolean; data?: { phone: string }; error?: string };

    if (!json.success) {
      throw new Error(json.error ?? "Failed to send");
    }

    // Mark reminder_sent optimistically in local state
    setDates((prev) =>
      prev.map((d) => (d.id === id ? { ...d, reminder_sent: true } : d))
    );

    toast({
      title: "WhatsApp reminder sent",
      description: `Sent to +91 ${json.data?.phone ?? ""}`,
      variant: "success",
    });
  }, []);

  const handleAddReminder = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.title.trim() || !form.due_date) {
        toast({ title: "Title and due date are required", variant: "destructive" });
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            due_date: form.due_date,
            filing_type: form.filing_type,
          }),
        });
        const json = await res.json() as { success: boolean; data?: ComplianceDate; error?: string };
        if (!json.success || !json.data) throw new Error(json.error ?? "Failed to create");

        setDates((prev) => [...prev, json.data!].sort((a, b) => a.due_date.localeCompare(b.due_date)));
        setForm({ title: "", description: "", due_date: "", filing_type: "custom" });
        setShowAddForm(false);
        toast({ title: "Reminder added", variant: "success" });
      } catch (err) {
        toast({
          title: "Failed to add reminder",
          description: err instanceof Error ? err.message : "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form]
  );

  const isPro = profile?.plan === "pro" || profile?.plan === "ca";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-saffron-600" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Compliance Calendar
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Track all your GST and tax filing deadlines.
            </p>
          </div>
        </div>

        <Button
          variant="saffron"
          size="sm"
          className="self-start sm:self-auto flex-shrink-0"
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Reminder
            </>
          )}
        </Button>
      </div>

      {/* No phone warning for Pro users */}
      {isPro && !profile?.phone && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3"
        >
          <span className="text-amber-500 text-base leading-none mt-0.5">⚠️</span>
          <p className="text-[13px] text-amber-800">
            <span className="font-semibold">Add your phone number</span> in{" "}
            <a href="/settings" className="underline">
              Settings
            </a>{" "}
            to receive WhatsApp reminders.
          </p>
        </motion.div>
      )}

      {/* Add reminder form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleAddReminder}
              className="rounded-xl border bg-card card-warm p-5 space-y-4"
            >
              <p
                className="text-[13px] font-semibold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                New Reminder
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. GSTR-1 for March 2026"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Type
                  </label>
                  <select
                    value={form.filing_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, filing_type: e.target.value as FilingType }))
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {FILING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Any additional notes…"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="saffron"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Reminder
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {isLoading ? (
        <RemindersPageSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ComplianceCalendar
            dates={dates}
            onMarkComplete={handleMarkComplete}
            onDelete={handleDelete}
            onSendWhatsApp={handleSendWhatsApp}
            userPlan={profile?.plan ?? "free"}
            userPhone={profile?.phone ?? null}
          />
        </motion.div>
      )}
    </div>
  );
}
