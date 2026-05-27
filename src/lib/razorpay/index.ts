import Razorpay from "razorpay";
import crypto from "crypto";

function getClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys not configured");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export const PLAN_AMOUNTS: Record<"pro" | "ca", number> = {
  pro: 19900, // ₹199 in paise
  ca: 49900,  // ₹499 in paise
};

export async function createOrder(plan: "pro" | "ca", userId: string) {
  const client = getClient();
  try {
    const order = await client.orders.create({
      amount: PLAN_AMOUNTS[plan],
      currency: "INR",
      receipt: `receipt_${userId.slice(0, 8)}_${Date.now()}`,
      notes: { plan, user_id: userId },
    });
    return order;
  } catch (err) {
    console.error("[razorpay/createOrder] SDK error:", err);
    throw err;
  }
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("Razorpay key secret not configured");

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}
