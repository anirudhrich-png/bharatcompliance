import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CADashboardClient } from "@/components/ca/CADashboardClient";
import type { Profile, CAClientSummary } from "@/types";

export const metadata = { title: "CA Partner Dashboard" };

export default async function CADashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Non-CA users see the upgrade wall (handled inside client component)
  if (profile?.plan !== "ca") {
    return <CADashboardClient profile={profile!} initialClients={[]} initialPendingInvites={[]} />;
  }

  // Fetch clients + pending invites server-side for initial render
  const [{ data: caClients }, { data: pendingInvites }] = await Promise.all([
    supabase
      .from("ca_clients")
      .select("id, client_user_id, invited_email, accepted_at")
      .eq("ca_user_id", user.id)
      .eq("status", "active")
      .order("accepted_at", { ascending: false }),
    supabase
      .from("ca_invites")
      .select("id, email, created_at, expires_at")
      .eq("ca_user_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  // Build lightweight summaries using admin client for cross-user data
  const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  const clients: CAClientSummary[] = await Promise.all(
    (caClients ?? []).map(async (rel) => {
      const clientId = rel.client_user_id as string;
      const [
        { data: clientProfile },
        { data: monthInvoices },
        { data: upcomingDates },
        { data: lastInvoice },
      ] = await Promise.all([
        admin.from("profiles").select("full_name, business_name, gstin, phone").eq("id", clientId).single<Pick<Profile, "full_name" | "business_name" | "gstin" | "phone">>(),
        admin.from("invoices").select("status").eq("user_id", clientId).gte("created_at", monthStart),
        admin.from("compliance_dates").select("due_date, status").eq("user_id", clientId).eq("status", "pending").gte("due_date", today).order("due_date", { ascending: true }).limit(1),
        admin.from("invoices").select("created_at").eq("user_id", clientId).order("created_at", { ascending: false }).limit(1),
      ]);

      const invoices = (monthInvoices ?? []) as { status: string }[];
      const deadlines = (upcomingDates ?? []) as { due_date: string; status: string }[];
      const pendingMismatches = invoices.filter((inv) => inv.status === "mismatch" || inv.status === "missing").length;
      const complianceScore = Math.max(0, Math.min(100, 100 - pendingMismatches * 15 - deadlines.length * 5));
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

  return (
    <CADashboardClient
      profile={profile!}
      initialClients={clients}
      initialPendingInvites={(pendingInvites ?? []) as { id: string; email: string; created_at: string; expires_at: string }[]}
    />
  );
}
