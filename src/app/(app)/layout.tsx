import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/layout/PageTransition";
import type { Profile } from "@/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header profile={profile} />
        <main className="flex-1 overflow-y-auto pb-safe-nav md:pb-6 scroll-touch">
          <div className="p-4 sm:p-6 min-h-full">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      <MobileNav profile={profile} />
    </div>
  );
}
