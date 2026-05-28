"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2, MessageCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { SubscriptionPlan } from "@/types";

interface AccountSettingsClientProps {
  initialPhone: string | null;
  userPlan: SubscriptionPlan;
  fullName: string;
}

export function AccountSettingsClient({
  initialPhone,
  userPlan,
  fullName,
}: AccountSettingsClientProps) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [editPhone, setEditPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const isPro = userPlan === "pro" || userPlan === "ca";

  const startEditing = () => {
    setEditPhone(phone);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditPhone("");
  };

  const handleSave = async () => {
    const trimmed = editPhone.trim();
    if (!/^[6-9]\d{9}$/.test(trimmed)) {
      toast({
        title: "Invalid phone number",
        description: "Enter a valid 10-digit Indian mobile number (starts with 6–9)",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });
      const json = await res.json() as { success: boolean; error?: string };

      if (!json.success) throw new Error(json.error ?? "Failed to save");

      setPhone(trimmed);
      setIsEditing(false);
      setTestSent(false);
      toast({ title: "Phone number saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to save",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestSending(true);
    try {
      const res = await fetch("/api/reminders/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      const json = await res.json() as { success: boolean; data?: { phone: string }; error?: string };

      if (!json.success) throw new Error(json.error ?? "Failed to send");

      setTestSent(true);
      toast({
        title: "Test message sent",
        description: `WhatsApp message sent to +91 ${json.data?.phone ?? phone}`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to send test",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <>
      {/* Phone number row */}
      <div className="flex items-center justify-between py-3 border-b gap-4">
        <span className="text-sm text-muted-foreground flex-shrink-0">Phone</span>

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="flex items-center rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
              <span className="px-2 text-sm text-muted-foreground border-r border-input bg-muted/40 h-8 flex items-center">
                +91
              </span>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                maxLength={10}
                className="w-28 h-8 px-2 text-sm bg-transparent outline-none text-foreground"
                autoFocus
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors disabled:opacity-50"
              title="Save"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={cancelEditing}
              disabled={isSaving}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {phone ? `+91 ${phone}` : "—"}
            </span>
            <button
              onClick={startEditing}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Edit phone number"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* No phone warning */}
      {!phone && !isEditing && (
        <div className="py-2 pb-3 border-b">
          <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ Add your phone number to receive WhatsApp reminders for GST deadlines.
          </p>
        </div>
      )}

      {/* Test WhatsApp — Pro only, phone must be set */}
      {isPro && phone && !isEditing && (
        <div className="flex items-center justify-between py-3 border-b gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">WhatsApp test</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Send a test message to +91 {phone}
            </p>
          </div>
          <button
            onClick={handleTestWhatsApp}
            disabled={testSending || testSent}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors disabled:opacity-60 flex-shrink-0 ${
              testSent
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {testSent ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Sent
              </>
            ) : testSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <MessageCircle className="h-3.5 w-3.5" />
                Send test
              </>
            )}
          </button>
        </div>
      )}

      {/* Upsell hint for free users */}
      {!isPro && phone && (
        <div className="py-3 border-b">
          <p className="text-[12px] text-muted-foreground">
            Upgrade to{" "}
            <a href="/settings#billing" className="text-saffron-600 font-medium hover:underline">
              Vyapaar Pro
            </a>{" "}
            to receive automatic WhatsApp reminders before GST deadlines.
          </p>
        </div>
      )}
    </>
  );
}
