import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types";

// DELETE /api/ca/invite/[inviteId] — cancel a pending invite
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
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

  const { inviteId } = await params;

  // RLS ensures only the owning CA can delete their invites
  const { error } = await supabase
    .from("ca_invites")
    .delete()
    .eq("id", inviteId)
    .eq("ca_user_id", user.id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
