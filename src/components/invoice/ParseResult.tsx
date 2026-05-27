"use client";

import { CheckCircle2, AlertCircle, Info, Package, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatGSTIN } from "@/lib/utils";
import type { ParsedInvoiceData } from "@/types";

interface ParseResultProps {
  data: ParsedInvoiceData;
  fileName: string;
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 gap-4" style={{ borderBottom: "1px solid hsl(var(--border) / 0.6)" }}>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex-shrink-0 mt-0.5">
        {label}
      </span>
      <span
        className={`text-[13px] text-right break-all leading-snug ${
          mono
            ? "font-mono text-[11px] tracking-wider"
            : "font-medium"
        } ${!value ? "text-muted-foreground/50 italic" : "text-foreground"}`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
      className="rounded-xl border bg-card card-warm overflow-hidden"
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="w-7 h-7 rounded-lg bg-saffron-100 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-saffron-600" />
        </div>
        <h3
          className="text-[13px] font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </motion.div>
  );
}

export function ParseResult({ data, fileName }: ParseResultProps) {
  const confidence = Math.round(data.confidence_score * 100);
  const isHigh = data.confidence_score >= 0.8;
  const isMed = data.confidence_score >= 0.6 && data.confidence_score < 0.8;

  const confidenceConfig = isHigh
    ? { bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, iconColor: "text-emerald-500", titleColor: "text-emerald-800", bodyColor: "text-emerald-700", badgeBg: "bg-emerald-100", badgeText: "text-emerald-800", label: "High confidence" }
    : isMed
    ? { bg: "bg-amber-50", border: "border-amber-200", icon: AlertCircle, iconColor: "text-amber-500", titleColor: "text-amber-800", bodyColor: "text-amber-700", badgeBg: "bg-amber-100", badgeText: "text-amber-800", label: "Medium confidence" }
    : { bg: "bg-red-50", border: "border-red-200", icon: AlertCircle, iconColor: "text-red-500", titleColor: "text-red-800", bodyColor: "text-red-700", badgeBg: "bg-red-100", badgeText: "text-red-800", label: "Low confidence — review carefully" };

  const Icon = confidenceConfig.icon;

  return (
    <div className="space-y-4">
      {/* ── Confidence banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex items-start gap-3 rounded-xl p-4 border ${confidenceConfig.bg} ${confidenceConfig.border}`}
      >
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${confidenceConfig.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${confidenceConfig.titleColor}`}>
              {confidenceConfig.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${confidenceConfig.badgeBg} ${confidenceConfig.badgeText}`}>
              {confidence}%
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${confidenceConfig.bodyColor}`}>
            Language detected: <strong>{data.language_detected}</strong> · {fileName}
          </p>
        </div>
      </motion.div>

      {/* ── Two-column detail grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section icon={Info} title="Invoice Details" delay={0.05}>
          <Field label="Invoice No." value={data.invoice_number} mono />
          <Field
            label="Invoice Date"
            value={data.invoice_date ? formatDate(data.invoice_date) : null}
          />
          <Field label="Vendor" value={data.vendor_name} />
          <Field label="Vendor GSTIN" value={data.vendor_gstin ? formatGSTIN(data.vendor_gstin) : null} mono />
          <Field label="Buyer GSTIN" value={data.buyer_gstin ? formatGSTIN(data.buyer_gstin) : null} mono />
        </Section>

        <Section icon={Building2} title="Tax Breakdown" delay={0.1}>
          <Field label="Subtotal" value={formatCurrency(data.subtotal)} />
          <Field label="CGST" value={formatCurrency(data.total_cgst)} />
          <Field label="SGST" value={formatCurrency(data.total_sgst)} />
          <Field label="IGST" value={formatCurrency(data.total_igst)} />
          <div className="flex items-center justify-between py-3 mt-1">
            <span className="text-[13px] font-bold text-foreground">Total Amount</span>
            <span
              className="text-xl font-bold text-foreground tabular-nums"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatCurrency(data.total_amount)}
            </span>
          </div>
        </Section>
      </div>

      {/* ── Line items ── */}
      {data.line_items.length > 0 && (
        <Section icon={Package} title={`Line Items (${data.line_items.length})`} delay={0.15}>
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr>
                  <th className="text-left py-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wide">Description</th>
                  <th className="text-right py-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wide">HSN</th>
                  <th className="text-right py-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wide">GST%</th>
                  <th className="text-right py-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wide">Taxable</th>
                  <th className="text-right py-2.5 text-muted-foreground font-medium text-[10px] uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.line_items.map((item, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-muted/20" : ""}
                    style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}
                  >
                    <td className="py-2.5 pr-4 font-medium text-foreground max-w-[180px] truncate">
                      {item.description}
                    </td>
                    <td className="py-2.5 text-right font-mono text-muted-foreground">
                      {item.hsn_code ?? "—"}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{item.gst_rate}%</td>
                    <td className="py-2.5 text-right tabular-nums text-foreground">
                      {formatCurrency(item.taxable_amount)}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}
