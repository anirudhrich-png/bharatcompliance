import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { caInviteSchema } from "@/lib/validations";
import type { ApiResponse, CAInvite, Profile } from "@/types";

// POST /api/ca/invite — create an invite
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ inviteLink: string; invite: CAInvite }>>> {
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

  // Check CA plan
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

  // Check client count limit (max 20)
  const { count } = await supabase
    .from("ca_clients")
    .select("*", { count: "exact", head: true })
    .eq("ca_user_id", user.id)
    .eq("status", "active");

  if ((count ?? 0) >= 20) {
    return NextResponse.json(
      { success: false, error: "Client limit of 20 reached", code: "CLIENT_LIMIT" },
      { status: 400 }
    );
  }

  const body: unknown = await request.json();
  const parsed = caInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // Upsert invite (same CA + email resets to pending)
  const { data: invite, error } = await supabase
    .from("ca_invites")
    .insert({ ca_user_id: user.id, email })
    .select()
    .single<CAInvite>();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const inviteLink = `${appUrl}/invite?token=${invite.token}`;

  return NextResponse.json({ success: true, data: { inviteLink, invite } }, { status: 201 });
}

// GET /api/ca/invite?token=xxx — validate token (public)
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ caBusinessName: string; caEmail: string }>>> {
  const token = request.nextUrl.searchParams.get("token");

  console.log("[GET /api/ca/invite] token:", token);

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Token required" },
      { status: 400 }
    );
  }

  // Must use admin client — RLS blocks anon/other-user reads on ca_invites
  const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
  const admin = createSupabaseAdminClient();

  const { data: invite, error } = await admin
    .from("ca_invites")
    .select("ca_user_id, status, expires_at")
    .eq("token", token)
    .single<{ ca_user_id: string; status: string; expires_at: string }>();

  console.log("[GET /api/ca/invite] query result:", { invite, error: error?.message });

  if (!invite) {
    return NextResponse.json(
      { success: false, error: "Token not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (invite.status === "accepted") {
    return NextResponse.json(
      { success: false, error: "Invite already accepted", code: "ALREADY_USED" },
      { status: 410 }
    );
  }

  if (invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, error: "Invite expired", code: "EXPIRED" },
      { status: 410 }
    );
  }

  const { data: caProfile } = await admin
    .from("profiles")
    .select("business_name")
    .eq("id", invite.ca_user_id)
    .single<Pick<Profile, "business_name">>();

  const { data: caAuthUser } = await admin.auth.admin.getUserById(invite.ca_user_id);

  return NextResponse.json({
    success: true,
    data: {
      caBusinessName: caProfile?.business_name ?? "Your CA",
      caEmail: caAuthUser.user?.email ?? "",
    },
  });
}
