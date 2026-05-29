import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { ArrowRight, Users, AlertCircle } from "lucide-react";
import type { Profile } from "@/types";

export const metadata = { title: "Accept Invitation — BharatCompliance" };

type InviteError = "not_found" | "expired" | "already_used";

interface InviteData {
  caBusinessName: string;
  caEmail: string;
  caUserId: string;
  invitedEmail: string;
  token: string;
}

type InviteResult =
  | { ok: true; data: InviteData }
  | { ok: false; reason: InviteError };

async function getInviteData(token: string): Promise<InviteResult> {
  const admin = createSupabaseAdminClient();

  const { data: invite } = await admin
    .from("ca_invites")
    .select("ca_user_id, status, expires_at, email")
    .eq("token", token)
    .single<{ ca_user_id: string; status: string; expires_at: string; email: string }>();

  if (!invite) {
    return { ok: false, reason: "not_found" };
  }

  if (invite.status === "accepted") {
    return { ok: false, reason: "already_used" };
  }

  if (invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
    return { ok: false, reason: "expired" };
  }

  const { data: caProfile } = await admin
    .from("profiles")
    .select("business_name")
    .eq("id", invite.ca_user_id)
    .single<Pick<Profile, "business_name">>();

  const { data: caAuthUser } = await admin.auth.admin.getUserById(invite.ca_user_id);

  return {
    ok: true,
    data: {
      caBusinessName: caProfile?.business_name ?? "Your CA",
      caEmail: caAuthUser.user?.email ?? "",
      caUserId: invite.ca_user_id,
      invitedEmail: invite.email,
      token,
    },
  };
}

const INVITE_ERROR_MESSAGES: Record<string, string> = {
  not_found: "This invite link doesn't exist. Check the link and try again.",
  expired: "This invite link has expired. Ask your CA to send a new one.",
  already_used: "This invite has already been accepted.",
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidInvite message="No invite token provided." />;
  }

  const result = await getInviteData(token);

  if (!result.ok) {
    return (
      <InvalidInvite
        message={INVITE_ERROR_MESSAGES[result.reason] ?? "Invalid invite link."}
      />
    );
  }

  const inviteData = result.data;

  // Check if user is logged in
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If logged in, accept the invite server-side and redirect to dashboard
  if (user) {
    if (inviteData.caUserId === user.id) {
      return <InvalidInvite message="You cannot accept your own invite." />;
    }

    const admin = createSupabaseAdminClient();

    await admin.from("ca_clients").upsert(
      {
        ca_user_id: inviteData.caUserId,
        client_user_id: user.id,
        status: "active",
        invited_email: inviteData.invitedEmail,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: "ca_user_id,client_user_id" }
    );

    await admin.from("ca_invites").update({ status: "accepted" }).eq("token", token);

    redirect(
      `/dashboard?invite_accepted=true&ca_name=${encodeURIComponent(inviteData.caBusinessName)}`
    );
  }

  // Not logged in — show invite page with sign in/register CTAs
  return (
    <div
      className="min-h-screen bg-[#fefce8] flex items-center justify-center p-4"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Minimal nav */}
      <div className="fixed top-0 left-0 right-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f97316] font-display text-xs font-bold text-white">
              BC
            </div>
            <span className="font-display text-base font-semibold text-[#0f172a]">
              BharatCompliance
            </span>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md pt-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200">
            <Users className="h-7 w-7 text-orange-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0f172a] mb-2">
            You&apos;ve been invited!
          </h1>
          <p className="text-slate-600 mb-1">
            <span className="font-semibold text-[#0f172a]">{inviteData.caBusinessName}</span> has
            invited you to connect your BharatCompliance account.
          </p>
          <p className="text-sm text-slate-400 mb-8">
            Once connected, your CA can view your invoices, compliance status, and help with GST
            reconciliation.
          </p>
          <div className="space-y-3">
            <Link
              href={`/register?invite=${encodeURIComponent(token)}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#f97316] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-500 transition-all"
            >
              Create account to accept
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/login?invite=${encodeURIComponent(token)}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-[#0f172a] hover:bg-slate-50 transition-all"
            >
              Already have an account? Sign in
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Invited by {inviteData.caEmail} · This link expires in 7 days
          </p>
        </div>
      </div>
    </div>
  );
}

function InvalidInvite({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#fefce8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#0f172a] mb-2">Invalid invite</h2>
          <p className="text-slate-500 mb-6">{message}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-6 py-3 text-sm font-semibold text-white hover:bg-orange-500 transition-all"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
