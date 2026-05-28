import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendWhatsAppMessage,
  formatReminderMessage,
} from "@/lib/twilio";
import type { ApiResponse } from "@/types";

interface ComplianceDateRow {
  id: string;
  user_id: string;
  title: string;
  filing_type: string;
  due_date: string;
  status: string;
  reminder_sent: boolean;
}

interface ProfileRow {
  id: string;
  full_name: string;
  phone: string | null;
  plan: string;
}

function daysUntil(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ sent: number; errors: number }>>> {
  // Verify cron secret — Vercel sends Authorization: Bearer <secret>
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Use service-role client to bypass RLS and access all users' data
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);

  const todayStr = today.toISOString().split("T")[0]!;
  const thresholdStr = threeDaysLater.toISOString().split("T")[0]!;

  // Find all pending reminders due in the next 3 days that haven't been sent
  const { data: dueDates, error: fetchError } = await supabaseAdmin
    .from("compliance_dates")
    .select("id, user_id, title, filing_type, due_date, status, reminder_sent")
    .eq("reminder_sent", false)
    .eq("status", "pending")
    .gte("due_date", todayStr)
    .lte("due_date", thresholdStr);

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: fetchError.message },
      { status: 500 }
    );
  }

  if (!dueDates || dueDates.length === 0) {
    return NextResponse.json({
      success: true,
      data: { sent: 0, errors: 0 },
      message: "No reminders due in the next 3 days",
    });
  }

  // Fetch profiles for the unique user IDs
  const userIds = [...new Set((dueDates as ComplianceDateRow[]).map((d) => d.user_id))];
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone, plan")
    .in("id", userIds);

  if (profileError) {
    return NextResponse.json(
      { success: false, error: profileError.message },
      { status: 500 }
    );
  }

  const profileMap = new Map<string, ProfileRow>(
    (profiles as ProfileRow[]).map((p) => [p.id, p])
  );

  let sent = 0;
  let errors = 0;
  const sentIds: string[] = [];

  for (const reminder of dueDates as ComplianceDateRow[]) {
    const profile = profileMap.get(reminder.user_id);

    // Only send to Pro/CA plan users with a phone number
    if (!profile || !profile.phone || profile.plan === "free") {
      continue;
    }

    const message = formatReminderMessage(
      profile.full_name,
      reminder.filing_type,
      reminder.due_date,
      daysUntil(reminder.due_date)
    );

    const result = await sendWhatsAppMessage(profile.phone, message);

    if (result.success) {
      sentIds.push(reminder.id);
      sent++;
    } else {
      errors++;
    }
  }

  // Bulk-mark as sent
  if (sentIds.length > 0) {
    await supabaseAdmin
      .from("compliance_dates")
      .update({ reminder_sent: true })
      .in("id", sentIds);
  }

  return NextResponse.json({
    success: true,
    data: { sent, errors },
    message: `Sent ${sent} reminder${sent !== 1 ? "s" : ""}, ${errors} error${errors !== 1 ? "s" : ""}`,
  });
}
