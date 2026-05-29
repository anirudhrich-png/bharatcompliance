import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { caInviteAcceptSchema } from "@/lib/validations";
import type { ApiResponse, Profile } from "@/types";

// POST /api/ca/invite/accept — accept an invite (must be authenticated)
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ caBusinessName: string }>>> {
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

  // Fetch the invite
  const { data: invite } = await supabase
    .from("ca_invites")
    .select("id, ca_user_id, status, expires_at, email")
    .eq("token", token)
    .single<{ id: string; ca_user_id: string; status: string; expires_at: string; email: string }>();

  if (!invite) {
    return NextResponse.json(
      { success: false, error: "Invalid invite link", code: "INVALID_TOKEN" },
      { status: 404 }
    );
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { success: false, error: "This invite has already been used", code: "ALREADY_USED" },
      { status: 410 }
    );
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, error: "This invite has expired", code: "TOKEN_EXPIRED" },
      { status: 410 }
    );
  }

  // Prevent CA from accepting their own invite
  if (invite.ca_user_id === user.id) {
    return NextResponse.json(
      { success: false, error: "You cannot accept your own invite" },
      { status: 400 }
    );
  }

  // Create ca_clients relationship (upsert handles duplicates)
  const { error: clientError } = await supabase.from("ca_clients").upsert(
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
    return NextResponse.json(
      { success: false, error: clientError.message },
      { status: 500 }
    );
  }

  // Mark invite accepted
  await supabase
    .from("ca_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  // Fetch CA business name for the success message
  const { data: caProfile } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("id", invite.ca_user_id)
    .single<Pick<Profile, "business_name">>();

  return NextResponse.json({
    success: true,
    data: { caBusinessName: caProfile?.business_name ?? "Your CA" },
  });
}
