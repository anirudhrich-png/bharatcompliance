"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { formatGSTIN } from "@/lib/utils";
import type { Profile } from "@/types";

interface HeaderProps {
  profile: Profile | null;
  title?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function Header({ profile, title }: HeaderProps) {
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <motion.header
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-0 sm:h-16 bg-background flex-shrink-0"
      style={{ borderBottom: "1px solid hsl(var(--border))" }}
    >
      {/* Left — greeting or title */}
      <div className="flex-1 min-w-0">
        {title ? (
          <h1
            className="text-base sm:text-lg font-bold text-foreground truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
        ) : (
          <>
            <h1
              className="text-[15px] sm:text-[15px] font-semibold text-foreground leading-snug"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {getGreeting()},{" "}
              <span className="text-saffron-600">{firstName}</span>
            </h1>
            <p className="text-[11px] sm:text-[12px] text-muted-foreground leading-snug hide-xs">
              {getFormattedDate()}
            </p>
          </>
        )}
      </div>

      {/* Right — GSTIN chip + bell */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {profile?.gstin && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/60">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              GSTIN
            </span>
            <span
              className="text-[11px] font-semibold text-foreground gstin tracking-wider"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {formatGSTIN(profile.gstin)}
            </span>
          </div>
        )}

        <button
          className="relative p-2 rounded-lg hover:bg-muted/70 transition-colors duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          <motion.span
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-saffron-500"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
        </button>
      </div>
    </motion.header>
  );
}
