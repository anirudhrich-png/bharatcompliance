import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ApiResponse, Profile, ComplianceDate } from "@/types";

export interface AppNotification {
  id: string;
  type: "new_client" | "deadline";
  title: string;
  description: string;
  timestamp?: string;
}

export async function GET(): Promise<NextResponse<ApiResponse<{ notifications: AppNotification[] }>>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const notifications: AppNotification[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single<Pick<Profile, "plan">>();

  // New client connections (CA users only)
  if (profile?.plan === "ca") {
    const admin = createSupabaseAdminClient();
    const { data: newClients } = await admin
      .from("ca_clients")
      .select("id, client_user_id, accepted_at")
      .eq("ca_user_id", user.id)
      .eq("status", "active")
      .gte("accepted_at", sevenDaysAgo)
      .order("accepted_at", { ascending: false });

    if (newClients && newClients.length > 0) {
      await Promise.all(
        newClients.map(async (rel: { id: string; client_user_id: string; accepted_at: string }) => {
          const { data: clientProfile } = await admin
            .from("profiles")
            .select("business_name, full_name")
            .eq("id", rel.client_user_id)
            .single<Pick<Profile, "business_name" | "full_name">>();

          notifications.push({
            id: `client-${rel.id}`,
            type: "new_client",
            title: "New client connected",
            description: `${clientProfile?.business_name ?? clientProfile?.full_name ?? "A client"} accepted your invite`,
            timestamp: rel.accepted_at,
          });
        })
      );
    }
  }

  // Upcoming deadlines (all users)
  const { data: deadlines } = await supabase
    .from("compliance_dates")
    .select("id, title, due_date, filing_type")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gte("due_date", now.toISOString().split("T")[0])
    .lte("due_date", threeDaysLater)
    .order("due_date", { ascending: true });

  if (deadlines) {
    for (const d of deadlines as Pick<ComplianceDate, "id" | "title" | "due_date" | "filing_type">[]) {
      const daysLeft = Math.ceil(
        (new Date(d.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `deadline-${d.id}`,
        type: "deadline",
        title: d.title,
        description:
          daysLeft === 0
            ? "Due today"
            : daysLeft === 1
            ? "Due tomorrow"
            : `Due in ${daysLeft} days`,
        timestamp: d.due_date,
      });
    }
  }

  // Sort: newest/most urgent first
  notifications.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return NextResponse.json({ success: true, data: { notifications } });
}
