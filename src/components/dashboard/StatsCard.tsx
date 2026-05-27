"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { FileText, AlertTriangle, Calendar, IndianRupee, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatsIconName = "FileText" | "AlertTriangle" | "Calendar" | "IndianRupee" | "TrendingUp";

const ICON_MAP: Record<StatsIconName, LucideIcon> = {
  FileText,
  AlertTriangle,
  Calendar,
  IndianRupee,
  TrendingUp,
};

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  iconName: StatsIconName;
  trend?: { value: number; label: string };
  color?: "saffron" | "green" | "gold" | "red" | "default";
  prefix?: string;
  suffix?: string;
  delay?: number;
  animate?: boolean;
}

const COLOR_MAP = {
  saffron: {
    icon: "bg-saffron-100 text-saffron-600",
    border: "border-saffron-100",
    trend: "text-saffron-600",
    glow: "rgba(249,115,22,0.08)",
  },
  green: {
    icon: "bg-emerald-100 text-emerald-600",
    border: "border-emerald-100",
    trend: "text-emerald-600",
    glow: "rgba(5,150,105,0.07)",
  },
  gold: {
    icon: "bg-amber-100 text-amber-600",
    border: "border-amber-100",
    trend: "text-amber-600",
    glow: "rgba(234,179,8,0.07)",
  },
  red: {
    icon: "bg-red-100 text-red-600",
    border: "border-red-100",
    trend: "text-red-600",
    glow: "rgba(239,68,68,0.07)",
  },
  default: {
    icon: "bg-muted text-muted-foreground",
    border: "border-border",
    trend: "text-muted-foreground",
    glow: "transparent",
  },
};

function AnimatedNumber({
  target,
  prefix = "",
  suffix = "",
  delay = 0,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration: 1.4,
      delay,
      ease: [0.23, 0.55, 0.35, 1],
    });
    return controls.stop;
  }, [target, delay, motionVal]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (displayRef.current) {
        displayRef.current.textContent = `${prefix}${v.toLocaleString("en-IN")}${suffix}`;
      }
    });
  }, [rounded, prefix, suffix]);

  return (
    <span ref={displayRef}>
      {prefix}0{suffix}
    </span>
  );
}

export function StatsCard({
  title,
  value,
  subtitle,
  iconName,
  trend,
  color = "default",
  prefix = "",
  suffix = "",
  delay = 0,
  animate: shouldAnimate = true,
}: StatsCardProps) {
  const Icon = ICON_MAP[iconName];
  const colors = COLOR_MAP[color];
  const isNumeric = typeof value === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="rounded-xl border bg-card p-5 cursor-default card-warm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            {title}
          </p>
          <p
            className="text-[1.75rem] font-bold text-foreground leading-none tabular-nums"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isNumeric && shouldAnimate ? (
              <AnimatedNumber
                target={value as number}
                prefix={prefix}
                suffix={suffix}
                delay={delay + 0.1}
              />
            ) : (
              `${prefix}${typeof value === "number" ? value.toLocaleString("en-IN") : value}${suffix}`
            )}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
          )}
          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", colors.trend)}>
              <span>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground font-normal">{trend.label}</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "p-2.5 rounded-xl flex-shrink-0",
            colors.icon
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
