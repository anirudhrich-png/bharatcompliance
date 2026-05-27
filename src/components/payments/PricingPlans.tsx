"use client";

import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { RazorpayCheckout } from "./RazorpayCheckout";
import type { SubscriptionPlan } from "@/types";

interface Plan {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  features: string[];
  highlighted: boolean;
  upgradeLabel: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Shuruat",
    tagline: "Get started",
    price: "₹0",
    priceNote: "forever",
    features: [
      "10 invoices / month",
      "AI invoice parsing (any Indian language)",
      "Basic compliance calendar",
      "Email support",
    ],
    highlighted: false,
    upgradeLabel: "",
  },
  {
    id: "pro",
    name: "Vyapaar",
    tagline: "For growing businesses",
    price: "₹199",
    priceNote: "per month",
    features: [
      "Unlimited invoices",
      "GSTR-2B reconciliation",
      "WhatsApp compliance reminders",
      "Voice input (Bhashini)",
      "CSV export",
      "Priority support",
    ],
    highlighted: true,
    upgradeLabel: "Upgrade to Vyapaar",
  },
  {
    id: "ca",
    name: "CA Partner",
    tagline: "For CAs & tax consultants",
    price: "₹499",
    priceNote: "per month",
    features: [
      "Everything in Vyapaar",
      "20 client accounts",
      "Bulk GSTR reconciliation",
      "White-label PDF reports",
      "Dedicated account manager",
    ],
    highlighted: false,
    upgradeLabel: "Upgrade to CA Partner",
  },
];

interface PricingPlansProps {
  currentPlan: SubscriptionPlan;
  planExpiresAt?: string | null;
  userName?: string;
  userEmail?: string;
}

export function PricingPlans({
  currentPlan,
  planExpiresAt,
  userName,
  userEmail,
}: PricingPlansProps) {
  const isUpgrade = (planId: SubscriptionPlan) => {
    const order: SubscriptionPlan[] = ["free", "pro", "ca"];
    return order.indexOf(planId) > order.indexOf(currentPlan);
  };

  return (
    <div className="space-y-4">
      {planExpiresAt && currentPlan !== "free" && (
        <p className="text-xs text-muted-foreground">
          Your {currentPlan === "ca" ? "CA Partner" : "Vyapaar"} plan renews on{" "}
          <span className="font-medium text-foreground">
            {new Date(planExpiresAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan, i) => {
          const isCurrent = plan.id === currentPlan;
          const canUpgrade = isUpgrade(plan.id);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-saffron-400 shadow-lg shadow-saffron-100"
                  : "border-border"
              } ${isCurrent ? "bg-emerald-50/50" : "bg-card"}`}
            >
              {/* Recommended badge */}
              {plan.highlighted && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-saffron-500">
                    <Zap className="h-2.5 w-2.5" />
                    Recommended
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-200">
                    <Check className="h-2.5 w-2.5" />
                    Current plan
                  </span>
                </div>
              )}

              {/* Plan info */}
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {plan.tagline}
                </p>
                <h3
                  className="text-lg font-bold text-foreground mb-0.5"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{plan.priceNote}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-emerald-600" />
                    </div>
                    <span className="text-[13px] text-foreground leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-100 text-center border border-emerald-200">
                  Active plan
                </div>
              ) : canUpgrade && (plan.id === "pro" || plan.id === "ca") ? (
                <RazorpayCheckout
                  plan={plan.id}
                  userName={userName}
                  userEmail={userEmail}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] ${
                    plan.highlighted
                      ? "bg-saffron-500 shadow-md shadow-saffron-100"
                      : "bg-foreground"
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  {plan.upgradeLabel}
                </RazorpayCheckout>
              ) : (
                <div className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-muted text-center">
                  {plan.id === "free" ? "Free forever" : "Contact us"}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
