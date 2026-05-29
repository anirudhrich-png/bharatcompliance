import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { caInviteAcceptSchema } from "@/lib/validations";
import type { ApiResponse, Profile } from "@/types";

// POST /api/ca/invite/accept — accept an invite (must be authenticated)
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ caBusinessName: string }>>> {
  // Auth check uses user's session (correct)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "You must be signed in to accept an invite", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body: unknown = await request.json();
  const parsed = caInviteAcceptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid token" },
      { status: 400 }
    );
  }

  const { token } = parsed.data;

  // All DB operations below use the admin client — RLS on ca_invites only allows
  // the CA owner to read/write their rows, but the client user accepting the invite
  // has a different uid. The token is the authorization here.
  const admin = createSupabaseAdminClient();

  const { data: invite, error } = await admin
    .from("ca_invites")
    .select("id, ca_user_id, status, expires_at, email")
    .eq("token", token)
    .single<{ id: string; ca_user_id: string; status: string; expires_at: string; email: string }>();

  console.log("[accept] invite lookup:", { token, invite: invite?.id, error: error?.message });

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

  if (invite.ca_user_id === user.id) {
    return NextResponse.json(
      { success: false, error: "You cannot accept your own invite" },
      { status: 400 }
    );
  }

  // Create ca_clients relationship — admin client bypasses RLS
  const { error: clientError } = await admin.from("ca_clients").upsert(
    {
      ca_user_id: invite.ca_user_id,
      client_user_id: user.id,
      status: "active",
      invited_email: invite.email,
      accepted_at: new Date().toISOString(),
    },
    { onConflict: "ca_user_id,client_user_id" }
  );

  if (clientError) {
    console.log("[accept] ca_clients upsert error:", clientError.message);
    return NextResponse.json(
      { success: false, error: clientError.message },
      { status: 500 }
    );
  }

  // Mark invite accepted — admin client
  await admin.from("ca_invites").update({ status: "accepted" }).eq("id", invite.id);

  const { data: caProfile } = await admin
    .from("profiles")
    .select("business_name")
    .eq("id", invite.ca_user_id)
    .single<Pick<Profile, "business_name">>();

  return NextResponse.json({
    success: true,
    data: { caBusinessName: caProfile?.business_name ?? "Your CA" },
  });
}
