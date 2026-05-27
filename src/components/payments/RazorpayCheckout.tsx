"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PLAN_LABELS: Record<"pro" | "ca", { name: string; price: string; description: string }> = {
  pro: { name: "Vyapaar Pro", price: "₹199/month", description: "Vyapaar Pro Plan — ₹199/month" },
  ca: { name: "CA Partner", price: "₹499/month", description: "CA Partner Plan — ₹499/month" },
};

interface Props {
  plan: "pro" | "ca";
  userName?: string;
  userEmail?: string;
  className?: string;
  children?: React.ReactNode;
}

export function RazorpayCheckout({ plan, userName, userEmail, className, children }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePayment = useCallback(async () => {
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load payment gateway. Check your internet connection.");
      }

      // Create Razorpay order server-side
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const orderJson = (await orderRes.json()) as {
        success: boolean;
        data?: { orderId: string; amount: number; currency: string; keyId: string };
        error?: string;
      };

      if (!orderJson.success || !orderJson.data) {
        throw new Error(orderJson.error ?? "Failed to create payment order");
      }

      const { orderId, amount, currency, keyId } = orderJson.data;
      const label = PLAN_LABELS[plan];

      // Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount,
          currency,
          name: "BharatCompliance",
          description: label.description,
          order_id: orderId,
          prefill: { name: userName, email: userEmail },
          theme: { color: "#f97316" },
          modal: {
            ondismiss: () => {
              setLoading(false);
              resolve(); // dismissed without payment — not an error
            },
          },
          handler: async (response) => {
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...response, plan }),
              });
              const verifyJson = (await verifyRes.json()) as {
                success: boolean;
                data?: { plan: string };
                error?: string;
              };

              if (!verifyJson.success) {
                throw new Error(verifyJson.error ?? "Payment verification failed");
              }

              toast({
                title: "Payment successful!",
                description: `You're now on the ${label.name} plan. Enjoy all features!`,
                variant: "success",
              });

              router.refresh();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });

        rzp.open();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      toast({ title: "Payment failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [plan, userName, userEmail, router]);

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing…
        </>
      ) : (
        children ?? (
          <>
            <Zap className="h-4 w-4" />
            Upgrade to {PLAN_LABELS[plan].name}
          </>
        )
      )}
    </button>
  );
}
