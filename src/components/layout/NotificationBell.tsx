"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Users, Calendar, X } from "lucide-react";
import type { AppNotification } from "@/app/api/notifications/route";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { notifications: AppNotification[] } }) => {
        if (json.success) setNotifications(json.data?.notifications ?? []);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unread = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-muted/70 transition-colors duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px] text-muted-foreground" />
        {loaded && unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-saffron-500 text-[9px] font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
        {loaded && unread === 0 && (
          <motion.span
            className="absolute top-2 right-2 w-2 h-2 rounded-full bg-saffron-500"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-white shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Notifications
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Items */}
            <div className="max-h-80 overflow-y-auto">
              {!loaded ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div
                        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                          n.type === "new_client"
                            ? "bg-emerald-100"
                            : "bg-amber-100"
                        }`}
                      >
                        {n.type === "new_client" ? (
                          <Users className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Calendar className="h-3.5 w-3.5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
