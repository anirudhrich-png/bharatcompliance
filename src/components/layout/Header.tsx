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
      className="flex items-center justify-between px-6 h-16 bg-background flex-shrink-0"
      style={{ borderBottom: "1px solid hsl(var(--border))" }}
    >
      {/* Left — greeting or title */}
      <div>
        {title ? (
          <h1
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
        ) : (
          <>
            <h1
              className="text-[15px] font-semibold text-foreground leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {getGreeting()},{" "}
              <span className="text-saffron-600">{firstName}</span>
            </h1>
            <p className="text-[12px] text-muted-foreground mt-1 leading-none">
              {getFormattedDate()}
            </p>
          </>
        )}
      </div>

      {/* Right — GSTIN chip + bell */}
      <div className="flex items-center gap-3">
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

        <button className="relative p-2 rounded-lg hover:bg-muted/70 transition-colors duration-150">
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          <motion.span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-saffron-500"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
        </button>
      </div>
    </motion.header>
  );
}
