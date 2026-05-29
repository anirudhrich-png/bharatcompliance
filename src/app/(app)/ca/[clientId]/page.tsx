import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { ClientDetailClient } from "@/components/ca/ClientDetailClient";
import type { Profile, Invoice, ComplianceDate } from "@/types";

export const metadata = { title: "Client Details — CA View" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify CA plan + active relationship
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single<Pick<Profile, "plan">>();

  if (profile?.plan !== "ca") redirect("/ca");

  const { data: relationship } = await supabase
    .from("ca_clients")
    .select("id")
    .eq("ca_user_id", user.id)
    .eq("client_user_id", clientId)
    .eq("status", "active")
    .single();

  if (!relationship) notFound();

  // Fetch client data via admin client (bypasses RLS)
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

  if (!clientProfile) notFound();

  const invoices = (monthInvoices ?? []) as Invoice[];
  const pendingMismatches = invoices.filter(
    (inv) => inv.status === "mismatch" || inv.status === "missing"
  ).length;
  const upcomingDeadlineCount = (complianceDates ?? []).filter(
    (d) => (d as ComplianceDate).status === "pending"
  ).length;
  const complianceScore = Math.max(
    0,
    Math.min(100, 100 - pendingMismatches * 15 - upcomingDeadlineCount * 5)
  );
  const totalItcThisMonth = invoices.reduce(
    (sum, inv) => sum + (inv.cgst ?? 0) + (inv.sgst ?? 0) + (inv.igst ?? 0),
    0
  );

  return (
    <ClientDetailClient
      clientUserId={clientId}
      profile={clientProfile}
      invoicesThisMonth={invoices}
      recentInvoices={(recentInvoices ?? []) as Invoice[]}
      complianceDates={(complianceDates ?? []) as ComplianceDate[]}
      complianceScore={complianceScore}
      pendingMismatches={pendingMismatches}
      totalItcThisMonth={totalItcThisMonth}
    />
  );
}
