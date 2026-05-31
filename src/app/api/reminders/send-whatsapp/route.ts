import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseUser } from "@/lib/supabase/server";
import {
  sendWhatsAppMessage,
  formatReminderMessage,
  formatTestMessage,
} from "@/lib/twilio";
import type { ApiResponse, ComplianceDate, Profile } from "@/types";

const bodySchema = z.union([
  z.object({ reminderId: z.string().uuid() }),
  z.object({ test: z.literal(true) }),
]);

function daysUntil(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ phone: string }>>> {
  try {
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_WHATSAPP_NUMBER
    ) {
      return NextResponse.json(
        { success: false, error: "WhatsApp not configured on server" },
        { status: 503 }
      );
    }

    const { user, supabase } = await getSupabaseUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single<Profile>();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.plan === "free") {
      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp reminders require Vyapaar Pro plan",
          code: "PLAN_REQUIRED",
        },
        { status: 403 }
      );
    }

    if (!profile.phone) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Add your phone number in Settings to receive WhatsApp reminders",
          code: "PHONE_MISSING",
        },
        { status: 422 }
      );
    }

    const body: unknown = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Invalid input",
        },
        { status: 400 }
      );
    }

    // ── Test message path ──
    if ("test" in parsed.data) {
      const message = formatTestMessage(profile.full_name, profile.phone);
      const result = await sendWhatsAppMessage(profile.phone, message);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error ?? "Failed to send" },
          { status: 502 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { phone: profile.phone },
        message: "Test message sent",
      });
    }

    // ── Reminder message path ──
    const { reminderId } = parsed.data;

    const { data: reminder } = await supabase
      .from("compliance_dates")
      .select("*")
      .eq("id", reminderId)
      .eq("user_id", user.id)
      .single<ComplianceDate>();

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 }
      );
    }

    const message = formatReminderMessage(
      profile.full_name,
      reminder.filing_type,
      reminder.due_date,
      daysUntil(reminder.due_date)
    );

    const result = await sendWhatsAppMessage(profile.phone, message);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Failed to send" },
        { status: 502 }
      );
    }

    await supabase
      .from("compliance_dates")
      .update({ reminder_sent: true })
      .eq("id", reminderId)
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      data: { phone: profile.phone },
      message: "Reminder sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
