import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ userId: string }>>> {
  const body: unknown = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, password, full_name, business_name, gstin, phone, language } =
    parsed.data;

  // createSupabaseAdminClient returns the base supabase-js client (service role),
  // which is the only client that exposes auth.admin.* methods.
  const admin = createSupabaseAdminClient();

  // Step 1: Create auth user. email_confirm skips the confirmation email.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const isDuplicate =
      authError.message.toLowerCase().includes("already registered") ||
      authError.message.toLowerCase().includes("already been registered");

    return NextResponse.json(
      {
        success: false,
        error: isDuplicate
          ? "An account with this email already exists."
          : authError.message,
      },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const userId = authData.user.id;

  // Step 2: Manually insert the profile using the service-role client.
  // This bypasses RLS and does not rely on any trigger on auth.users.
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    full_name,
    business_name,
    gstin,
    phone,
    language,
    plan: "free",
  });

  if (profileError) {
    // Rollback: remove the auth user so the email can be reused.
    await admin.auth.admin.deleteUser(userId);

    // 23505 = unique_violation. Only surface "GSTIN exists" when the violated
    // constraint is specifically on the gstin column; a PK conflict caused by
    // an auth.users trigger also produces 23505 but shouldn't show that message.
    const isGstinConflict =
      profileError.code === "23505" &&
      (profileError.message.toLowerCase().includes("gstin") ||
        profileError.details?.toLowerCase().includes("gstin"));

    return NextResponse.json(
      {
        success: false,
        error: isGstinConflict
          ? "A profile with this GSTIN already exists."
          : "Failed to create profile. Please try again.",
      },
      { status: isGstinConflict ? 409 : 500 }
    );
  }

  return NextResponse.json({ success: true, data: { userId } }, { status: 201 });
}
