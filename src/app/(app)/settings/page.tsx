import { redirect } from "next/navigation";
import { Settings, User, CreditCard, Building2, Shield } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PricingPlans } from "@/components/payments/PricingPlans";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { AccountSettingsClient } from "@/components/settings/AccountSettingsClient";
import { TallyGuide } from "@/components/settings/TallyGuide";
import type { Profile } from "@/types";

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const planLabel =
    profile?.plan === "ca"
      ? "CA Partner"
      : profile?.plan === "pro"
      ? "Vyapaar Pro"
      : "Shuruat (Free)";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center flex-shrink-0">
          <Settings className="h-5 w-5 text-saffron-600" />
        </div>
        <div>
          <h1
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Settings
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Manage your account details and subscription.
          </p>
        </div>
      </div>

      {/* Account details */}
      <section className="rounded-2xl border bg-card p-6 space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
        </div>

        <InfoRow label="Full name" value={profile?.full_name} />
        <InfoRow label="Email" value={user.email} />

        {/* Editable phone field + WhatsApp test */}
        <AccountSettingsClient
          initialPhone={profile?.phone ?? null}
          userPlan={profile?.plan ?? "free"}
          fullName={profile?.full_name ?? ""}
        />

        <div className="flex items-center justify-between py-3 border-b last:border-0">
          <span className="text-sm text-muted-foreground">Current plan</span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
              profile?.plan === "pro" || profile?.plan === "ca"
                ? "bg-saffron-100 text-saffron-700"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {planLabel}
          </span>
        </div>
      </section>

      {/* Business details */}
      <section className="rounded-2xl border bg-card p-6 space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Business</h2>
        </div>

        <InfoRow label="Business name" value={profile?.business_name} />
        <InfoRow label="GSTIN" value={profile?.gstin} />
        <InfoRow
          label="Preferred language"
          value={profile?.language ? profile.language.toUpperCase() : undefined}
        />
      </section>

      {/* Security */}
      <section className="rounded-2xl border bg-card p-6 space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Security</h2>
        </div>

        <InfoRow label="User ID" value={user.id.slice(0, 8) + "…"} />
        <InfoRow
          label="Account created"
          value={new Date(user.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        />
      </section>

      {/* Billing & Plans */}
      <section id="billing" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-saffron-100 flex items-center justify-center">
            <CreditCard className="h-3.5 w-3.5 text-saffron-600" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Billing & Plans</h2>
        </div>

        <PricingPlans
          currentPlan={profile?.plan ?? "free"}
          planExpiresAt={profile?.plan_expires_at}
          userName={profile?.full_name ?? undefined}
          userEmail={user.email ?? undefined}
        />

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          Secured by Razorpay · 256-bit SSL · All major UPI, cards, net banking accepted
        </p>
      </section>

      {/* Tally Integration Guide — CA / Pro feature */}
      {(profile?.plan === "pro" || profile?.plan === "ca") && (
        <TallyGuide />
      )}

      {/* Sign out */}
      <section className="rounded-2xl border border-red-100 bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Sign out</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Sign out of your BharatCompliance account on this device.
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
