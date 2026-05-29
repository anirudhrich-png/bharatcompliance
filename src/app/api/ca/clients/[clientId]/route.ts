import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ApiResponse, Profile, Invoice, ComplianceDate } from "@/types";

// DELETE /api/ca/clients/[clientId] — revoke CA access to a client
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  const { clientId } = await params;
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

  const { error } = await supabase
    .from("ca_clients")
    .update({ status: "revoked" })
    .eq("ca_user_id", user.id)
    .eq("client_user_id", clientId)
    .eq("status", "active");

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}

// GET /api/ca/clients/[clientId] — fetch client detail data (CA-scoped)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
): Promise<NextResponse<ApiResponse<{
  profile: Pick<Profile, "full_name" | "business_name" | "gstin" | "phone" | "language">;
  invoicesThisMonth: Invoice[];
  recentInvoices: Invoice[];
  complianceDates: ComplianceDate[];
  complianceScore: number;
  pendingMismatches: number;
  totalItcThisMonth: number;
}>>> {
  const { clientId } = await params;
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

  // Verify CA relationship
  const { data: relationship } = await supabase
    .from("ca_clients")
    .select("id")
    .eq("ca_user_id", user.id)
    .eq("client_user_id", clientId)
    .eq("status", "active")
    .single();

  if (!relationship) {
    return NextResponse.json(
      { success: false, error: "Client not found or access revoked", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const admin = createSupabaseAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  const [
    { data: clientProfile },
    { data: monthInvoices },
    { data: recentInvoices },
    { data: complianceDates },
  ] = await Promise.all([
    admin.from("profiles").select("full_name, business_name, gstin, phone, language").eq("id", clientId).single<Pick<Profile, "full_name" | "business_name" | "gstin" | "phone" | "language">>(),
    admin.from("invoices").select("*").eq("user_id", clientId).gte("created_at", monthStart).order("created_at", { ascending: false }),
    admin.from("invoices").select("*").eq("user_id", clientId).order("created_at", { ascending: false }).limit(10),
    admin.from("compliance_dates").select("*").eq("user_id", clientId).gte("due_date", today).order("due_date", { ascending: true }),
  ]);

  const invoices = (monthInvoices ?? []) as Invoice[];
  const pendingMismatches = invoices.filter(
    (inv) => inv.status === "mismatch" || inv.status === "missing"
  ).length;
  const upcomingDeadlines = (complianceDates ?? []).filter((d) => (d as ComplianceDate).status === "pending").length;
  const complianceScore = Math.max(0, Math.min(100, 100 - pendingMismatches * 15 - upcomingDeadlines * 5));
  const totalItcThisMonth = invoices.reduce(
    (sum, inv) => sum + (inv.cgst ?? 0) + (inv.sgst ?? 0) + (inv.igst ?? 0),
    0
  );

  return NextResponse.json({
    success: true,
    data: {
      profile: clientProfile ?? { full_name: "Unknown", business_name: "Unknown", gstin: null, phone: null, language: "en" },
      invoicesThisMonth: invoices,
      recentInvoices: (recentInvoices ?? []) as Invoice[],
      complianceDates: (complianceDates ?? []) as ComplianceDate[],
      complianceScore,
      pendingMismatches,
      totalItcThisMonth,
    },
  });
}
