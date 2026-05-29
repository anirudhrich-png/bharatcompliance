"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  RefreshCcw,
  Calendar,
  Settings,
  LogOut,
  Zap,
  ArrowUpRight,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, caOnly: false },
  { href: "/invoice/upload", label: "Invoices", icon: FileText, caOnly: false },
  { href: "/gstr", label: "GSTR Reconciliation", icon: RefreshCcw, caOnly: false },
  { href: "/ca", label: "Clients", icon: Users, caOnly: true },
  { href: "/reminders", label: "Compliance Calendar", icon: Calendar, caOnly: false },
  { href: "/settings", label: "Settings", icon: Settings, caOnly: false },
];

interface SidebarProps {
  profile: Profile | null;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "BC";

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="hidden md:flex w-64 flex-col h-screen flex-shrink-0 bg-[#0f172a]"
      style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="w-8 h-8 rounded-xl bg-saffron-500 flex items-center justify-center flex-shrink-0">
          <span
            className="text-white font-bold text-sm tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            BC
          </span>
        </div>
        <span
          className="text-white font-semibold text-[15px] leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          BharatCompliance
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {BASE_NAV_ITEMS.filter((item) => !item.caOnly || profile?.plan === "ca").map(({ href, label, icon: Icon }, index) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + index * 0.04, duration: 0.2 }}
            >
              <Link
                href={href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-saffron-500/10 text-saffron-300"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
                )}
              >
                {/* Animated left-border indicator — replaces the broken inline borderLeft */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-indicator"
                    className="absolute left-0 inset-y-1.5 w-[3px] rounded-r-full bg-saffron-500"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150",
                    isActive ? "text-saffron-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span className="flex-1">{label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* ── Upgrade nudge (free plan only) ── */}
      {profile?.plan === "free" && (
        <div className="px-3 mb-3">
          <div
            className="rounded-xl p-3.5"
            style={{
              background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,179,8,0.06))",
              border: "1px solid rgba(249,115,22,0.18)",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="h-3.5 w-3.5 text-saffron-400" />
              <span
                className="text-xs font-semibold text-saffron-300"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Upgrade to Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Unlock GSTR reconciliation, WhatsApp reminders, and more.
            </p>
            <Link
              href="/settings?tab=billing"
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
              style={{ background: "hsl(var(--primary))" }}
            >
              Upgrade — ₹199/mo
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* ── User profile ── */}
      <div
        className="px-3 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-saffron-500/20 border border-saffron-500/30 flex items-center justify-center text-[11px] font-bold text-saffron-300 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-medium text-slate-100 truncate leading-none">
                {profile?.full_name ?? "User"}
              </p>
              <span
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0",
                  profile?.plan === "pro" || profile?.plan === "ca"
                    ? "bg-saffron-500/20 text-saffron-300"
                    : "bg-white/10 text-slate-400"
                )}
              >
                {profile?.plan ?? "free"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-none">
              {profile?.business_name ?? ""}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors flex-shrink-0 group"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
