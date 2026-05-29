import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LandingPage from "@/components/landing/LandingPage";

export const metadata = {
  title: "BharatCompliance — GST Compliance for Indian MSMEs",
  description:
    "AI-powered invoice parsing and GSTR-2B reconciliation for Indian MSMEs. Works in Hindi, Tamil, Telugu and 8+ languages.",
};

export default async function RootPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
