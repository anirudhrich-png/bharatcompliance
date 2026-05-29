"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  X,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Calendar,
  FileText,
  ChevronRight,
  Clock,
  Mail,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { CircularProgress } from "@/components/ui/circular-progress";
import { formatCurrency } from "@/lib/utils";
import type { CAClientSummary, Profile } from "@/types";

interface CADashboardClientProps {
  profile: Profile;
  initialClients: CAClientSummary[];
  initialPendingInvites: { id: string; email: string; created_at: string; expires_at: string }[];
}

// ── Avatar helpers ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-cyan-500",
  "bg-pink-500", "bg-indigo-500",
];

function clientColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── Invite Modal ────────────────────────────────────────────────────────────
function InviteModal({
  onClose,
  clientCount,
}: {
  onClose: () => void;
  clientCount: number;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvite = async () => {
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ca/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json() as { success: boolean; data?: { inviteLink: string }; error?: string };
      if (!json.success) {
        setError(json.error ?? "Failed to create invite");
      } else {
        setInviteLink(json.data?.inviteLink ?? null);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "Invite link copied!", description: "Share it with your client." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Invite a client</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{clientCount}/20 clients used</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {!inviteLink ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Client email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                placeholder="ca-client@example.com"
                className="w-full rounded-lg border border-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-saffron-500/25 focus:border-saffron-500 transition-all"
              />
              {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              They&apos;ll receive an invite link valid for 7 days. They can use any existing
              BharatCompliance account or create a new one.
            </p>
            <button
              onClick={sendInvite}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-saffron-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-600 disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Generate invite link
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">Invite link created</p>
              </div>
              <p className="text-xs text-emerald-600 mb-3">
                Share this link with <strong>{email}</strong>. It expires in 7 days.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white p-2.5">
                <code className="flex-1 truncate text-xs font-mono text-slate-600">
                  {inviteLink}
                </code>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setInviteLink(null); setEmail(""); }}
                className="flex-1 rounded-lg border border-input px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
              >
                Invite another
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-saffron-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-600 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Remove confirmation dialog ──────────────────────────────────────────────
function RemoveDialog({
  clientName,
  onConfirm,
  onCancel,
  loading,
}: {
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-5 w-5 text-red-600" />
        </div>
        <h3 className="font-display text-base font-bold text-foreground mb-1">Remove client?</h3>
        <p className="text-sm text-muted-foreground mb-5">
          This will revoke your access to <strong>{clientName}</strong>&apos;s account. Their data
          will remain intact, but you won&apos;t be able to view it anymore.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-all"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Remove
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Client Card ─────────────────────────────────────────────────────────────
function ClientCard({
  client,
  onRemove,
}: {
  client: CAClientSummary;
  onRemove: (clientUserId: string, name: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nextDeadlineDays = client.nextDeadline
    ? Math.ceil(
        (new Date(client.nextDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="card-warm rounded-xl border bg-card p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 flex-shrink-0 rounded-full ${clientColor(client.profile.full_name)} flex items-center justify-center text-sm font-bold text-white`}
          >
            {initials(client.profile.full_name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate leading-tight">
              {client.profile.business_name}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
              {client.profile.gstin ?? "GSTIN not set"}
            </p>
          </div>
        </div>

        {/* Three-dot menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-border bg-white shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove(client.clientUserId, client.profile.business_name);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove client
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mini stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/40 p-2.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Invoices</span>
          </div>
          <p className="font-display text-lg font-bold text-foreground tabular-nums">
            {client.invoicesThisMonth}
          </p>
        </div>

        <div className={`rounded-lg p-2.5 ${client.pendingMismatches > 0 ? "bg-red-50" : "bg-muted/40"}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <AlertTriangle className={`h-3 w-3 ${client.pendingMismatches > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${client.pendingMismatches > 0 ? "text-red-600" : "text-muted-foreground"}`}>Mismatches</span>
          </div>
          <p className={`font-display text-lg font-bold tabular-nums ${client.pendingMismatches > 0 ? "text-red-600" : "text-foreground"}`}>
            {client.pendingMismatches}
          </p>
        </div>

        <div className={`rounded-lg p-2.5 ${nextDeadlineDays !== null && nextDeadlineDays < 7 ? "bg-amber-50" : "bg-muted/40"}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Calendar className={`h-3 w-3 ${nextDeadlineDays !== null && nextDeadlineDays < 7 ? "text-amber-500" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${nextDeadlineDays !== null && nextDeadlineDays < 7 ? "text-amber-600" : "text-muted-foreground"}`}>Next deadline</span>
          </div>
          <p className={`font-display text-sm font-bold leading-tight ${nextDeadlineDays !== null && nextDeadlineDays < 7 ? "text-amber-600" : "text-foreground"}`}>
            {client.nextDeadline
              ? `${nextDeadlineDays}d`
              : "None"}
          </p>
        </div>

        <div className="rounded-lg bg-muted/40 p-2.5 flex items-center gap-2">
          <CircularProgress value={client.complianceScore} size={36} strokeWidth={4} />
          <div>
            <p className="text-[10px] text-muted-foreground">Score</p>
            <p className="font-display text-sm font-bold text-foreground">{client.complianceScore}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/60">
        {client.lastInvoiceDate ? (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last invoice {new Date(client.lastInvoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">No invoices yet</span>
        )}
        <Link
          href={`/ca/${client.clientUserId}`}
          className="flex items-center gap-1 text-xs font-semibold text-saffron-600 hover:text-saffron-700 transition-colors"
        >
          View details
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Pending Invites ─────────────────────────────────────────────────────────
function PendingInvites({
  invites,
  onCancel,
}: {
  invites: { id: string; email: string; created_at: string; expires_at: string }[];
  onCancel: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { toast } = useToast();

  if (invites.length === 0) return null;

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      const res = await fetch(`/api/ca/invite/${id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        onCancel(id);
        toast({ title: "Invite cancelled" });
      } else {
        toast({ title: "Error", description: json.error ?? "Failed to cancel invite", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-display text-sm font-semibold text-foreground mb-3">
        Pending invites ({invites.length})
      </h3>
      <div className="space-y-2">
        {invites.map((inv) => {
          const expiresIn = Math.ceil(
            (new Date(inv.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div key={inv.id} className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-foreground truncate">{inv.email}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-amber-600 font-medium">
                  {expiresIn}d left
                </span>
                <button
                  onClick={() => handleCancel(inv.id)}
                  disabled={cancelling === inv.id}
                  className="flex items-center justify-center rounded-md p-1 text-amber-600 hover:bg-amber-200 disabled:opacity-50 transition-colors"
                  aria-label="Cancel invite"
                >
                  {cancelling === inv.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Upgrade wall (non-CA plan) ──────────────────────────────────────────────
function UpgradeWall() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-saffron-50 border border-saffron-200">
        <Users className="h-7 w-7 text-saffron-500" />
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">CA Partner Dashboard</h2>
      <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Manage up to 20 client accounts, view their compliance status, and run bulk reconciliation —
        all from one dashboard. Upgrade to CA Partner to unlock.
      </p>
      <Link
        href="/settings?tab=billing"
        className="inline-flex items-center gap-2 rounded-xl bg-saffron-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-saffron-500/25 hover:bg-saffron-600 transition-all"
      >
        Upgrade to CA Partner — ₹499/mo
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function CADashboardClient({
  profile,
  initialClients,
  initialPendingInvites,
}: CADashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<CAClientSummary[]>(initialClients);
  const [pendingInvites, setPendingInvites] = useState(initialPendingInvites);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const handleCancelInvite = useCallback((id: string) => {
    setPendingInvites((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  if (profile.plan !== "ca") return <UpgradeWall />;

  const handleRemove = useCallback(async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/ca/clients/${removeTarget.id}`, { method: "DELETE" });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        setClients((prev) => prev.filter((c) => c.clientUserId !== removeTarget.id));
        toast({ title: "Client removed", description: `${removeTarget.name} has been removed.` });
        router.refresh();
      } else {
        toast({ title: "Error", description: json.error ?? "Failed to remove client", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setRemoveLoading(false);
      setRemoveTarget(null);
    }
  }, [removeTarget, router, toast]);

  const handleInviteClose = () => {
    setShowInviteModal(false);
    // Refresh to pick up new pending invites
    router.refresh();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Your Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and monitor your client accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-saffron-200 bg-saffron-50 px-3 py-1 text-xs font-semibold text-saffron-700">
            {clients.length}/20 clients
          </span>
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={clients.length >= 20}
            className="flex items-center gap-2 rounded-xl bg-saffron-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-saffron-500/25 hover:bg-saffron-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="h-4 w-4" />
            Invite client
          </button>
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <PendingInvites invites={pendingInvites} onCancel={handleCancelInvite} />
      )}

      {/* Client grid or empty state */}
      {clients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 py-20 text-center px-4"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron-50">
            <Users className="h-6 w-6 text-saffron-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">No clients yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Invite your first client to start monitoring their GST compliance from one place.
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 rounded-xl bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-saffron-600 transition-all"
          >
            <Plus className="h-4 w-4" />
            Invite your first client
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {clients.map((client) => (
              <ClientCard
                key={client.clientUserId}
                client={client}
                onRemove={(id, name) => setRemoveTarget({ id, name })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            onClose={handleInviteClose}
            clientCount={clients.length}
          />
        )}
        {removeTarget && (
          <RemoveDialog
            clientName={removeTarget.name}
            onConfirm={handleRemove}
            onCancel={() => setRemoveTarget(null)}
            loading={removeLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
