import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InvoiceHistoryClient } from "@/components/invoice/InvoiceHistoryClient";
import type { Profile } from "@/types";

export default async function InvoiceHistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single<Pick<Profile, "plan">>();

  return <InvoiceHistoryClient userPlan={profile?.plan ?? "free"} />;
}
