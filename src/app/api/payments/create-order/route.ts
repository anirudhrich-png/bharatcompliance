import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrder, PLAN_AMOUNTS } from "@/lib/razorpay";
import type { ApiResponse } from "@/types";

const schema = z.object({
  plan: z.enum(["pro", "ca"]),
});

interface OrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<OrderResponse>>> {
  // Fast-fail if keys are missing — avoids a confusing 500 from inside the Razorpay SDK
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("[payments/create-order] Razorpay keys not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local");
    return NextResponse.json(
      { success: false, error: "Payment gateway not configured", code: "RAZORPAY_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

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

    const { plan } = parsed.data;
    const order = await createOrder(plan, user.id);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: PLAN_AMOUNTS[plan],
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      },
    });
  } catch (err) {
    console.error("[payments/create-order] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
