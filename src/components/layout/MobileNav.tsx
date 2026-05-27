"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, RefreshCcw, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoice/upload", label: "Invoices", icon: FileText },
  { href: "/gstr", label: "GSTR", icon: RefreshCcw },
  { href: "/reminders", label: "Calendar", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10"
      style={{
        background: "rgba(15, 23, 42, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch justify-around px-1" style={{ minHeight: "56px" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative py-2 min-h-[44px]"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-active"
                  className="absolute inset-x-3 top-0 h-[2px] rounded-b-full bg-saffron-500"
                />
              )}
              <Icon
                className={cn(
                  "h-[20px] w-[20px] transition-colors duration-150",
                  isActive ? "text-saffron-400" : "text-slate-500"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors duration-150 leading-none",
                  isActive ? "text-saffron-400" : "text-slate-500"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
