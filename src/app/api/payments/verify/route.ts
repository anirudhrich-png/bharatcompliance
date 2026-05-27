import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyPaymentSignature, PLAN_AMOUNTS } from "@/lib/razorpay";
import type { ApiResponse, Profile } from "@/types";

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan: z.enum(["pro", "ca"]),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ plan: string; plan_expires_at: string }>>> {
  try {
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

    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } =
      parsed.data;

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed — invalid signature" },
        { status: 400 }
      );
    }

    // 30 days from now
    const planExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Record subscription
    await supabase.from("subscriptions").insert({
      user_id: user.id,
      razorpay_order_id,
      razorpay_payment_id,
      plan,
      amount: PLAN_AMOUNTS[plan] / 100,
      currency: "INR",
      status: "paid",
    });

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan, plan_expires_at: planExpiresAt, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { plan, plan_expires_at: planExpiresAt },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
