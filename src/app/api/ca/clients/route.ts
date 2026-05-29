import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ApiResponse, CAClientSummary, Profile, Invoice, ComplianceDate } from "@/types";

// GET /api/ca/clients — list all active clients with stats
export async function GET(
  _request: NextRequest
): Promise<NextResponse<ApiResponse<{ clients: CAClientSummary[]; pendingInvites: { id: string; email: string; created_at: string; expires_at: string }[] }>>> {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single<Pick<Profile, "plan">>();

  if (profile?.plan !== "ca") {
    return NextResponse.json(
      { success: false, error: "CA plan required", code: "PLAN_REQUIRED" },
      { status: 403 }
    );
  }

  // Fetch active client relationships
  const { data: caClients } = await supabase
    .from("ca_clients")
    .select("id, client_user_id, invited_email, accepted_at")
    .eq("ca_user_id", user.id)
    .eq("status", "active")
    .order("accepted_at", { ascending: false });

  // Fetch pending invites
  const { data: pendingInvites } = await supabase
    .from("ca_invites")
    .select("id, email, created_at, expires_at")
    .eq("ca_user_id", user.id)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (!caClients || caClients.length === 0) {
    return NextResponse.json({
      success: true,
      data: { clients: [], pendingInvites: pendingInvites ?? [] },
    });
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const clientSummaries: CAClientSummary[] = await Promise.all(
    caClients.map(async (rel) => {
      const clientId = rel.client_user_id as string;

      const [
        { data: clientProfile },
        { data: monthInvoices },
        { data: upcomingDates },
        { data: lastInvoice },
      ] = await Promise.all([
        admin.from("profiles").select("full_name, business_name, gstin, phone").eq("id", clientId).single<Pick<Profile, "full_name" | "business_name" | "gstin" | "phone">>(),
        admin.from("invoices").select("status").eq("user_id", clientId).gte("created_at", monthStart),
        admin.from("compliance_dates").select("due_date, status").eq("user_id", clientId).eq("status", "pending").gte("due_date", now.toISOString().split("T")[0]).order("due_date", { ascending: true }).limit(1),
        admin.from("invoices").select("created_at").eq("user_id", clientId).order("created_at", { ascending: false }).limit(1),
      ]);

      const invoices = (monthInvoices ?? []) as Pick<Invoice, "status">[];
      const deadlines = (upcomingDates ?? []) as Pick<ComplianceDate, "due_date" | "status">[];

      const pendingMismatches = invoices.filter(
        (inv) => inv.status === "mismatch" || inv.status === "missing"
      ).length;

      const upcomingDeadlineCount = deadlines.length;
      const complianceScore = Math.max(
        0,
        Math.min(100, 100 - pendingMismatches * 15 - upcomingDeadlineCount * 5)
      );

      const lastInvoiceData = lastInvoice as { created_at: string }[] | null;

      return {
        relationshipId: rel.id as string,
        clientUserId: clientId,
        profile: {
          full_name: clientProfile?.full_name ?? "Unknown",
          business_name: clientProfile?.business_name ?? "Unknown",
          gstin: clientProfile?.gstin ?? null,
          phone: clientProfile?.phone ?? null,
        },
        invoicesThisMonth: invoices.length,
        pendingMismatches,
        nextDeadline: deadlines[0]?.due_date ?? null,
        lastInvoiceDate: lastInvoiceData?.[0]?.created_at ?? null,
        complianceScore,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: { clients: clientSummaries, pendingInvites: pendingInvites ?? [] },
  });
}
