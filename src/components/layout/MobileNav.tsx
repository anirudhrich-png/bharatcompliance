"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, RefreshCcw, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/invoice/upload", label: "Invoices", icon: FileText },
  { href: "/gstr", label: "GSTR", icon: RefreshCcw },
  { href: "/reminders", label: "Calendar", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0f172a] border-t border-white/10 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative py-2"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-active"
                  className="absolute inset-x-2 -top-px h-0.5 rounded-b-full bg-saffron-500"
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors duration-150",
                  isActive ? "text-saffron-400" : "text-slate-500"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors duration-150",
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
