// ============================================================
// BharatCompliance — Central Type Definitions
// ============================================================

// --- User & Auth ---

export interface Profile {
  id: string;
  full_name: string;
  gstin: string | null;
  business_name: string;
  phone: string | null;
  language: IndianLanguage;
  plan: SubscriptionPlan;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type IndianLanguage =
  | "en"
  | "hi"
  | "ta"
  | "te"
  | "mr"
  | "bn"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as";

export const LANGUAGE_LABELS: Record<IndianLanguage, string> = {
  en: "English",
  hi: "हिंदी",
  ta: "தமிழ்",
  te: "తెలుగు",
  mr: "मराठी",
  bn: "বাংলা",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
  as: "অসমীয়া",
};

export type SubscriptionPlan = "free" | "pro" | "ca";

export const PLAN_LIMITS: Record<SubscriptionPlan, { invoicesPerMonth: number; gstrReconciliation: boolean; clientAccounts: number }> = {
  free: { invoicesPerMonth: 10, gstrReconciliation: false, clientAccounts: 0 },
  pro: { invoicesPerMonth: Infinity, gstrReconciliation: true, clientAccounts: 0 },
  ca: { invoicesPerMonth: Infinity, gstrReconciliation: true, clientAccounts: 20 },
};

// --- Invoice ---

export interface Invoice {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  vendor_name: string | null;
  vendor_gstin: string | null;
  buyer_gstin: string | null;
  taxable_amount: number | null;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  total_amount: number | null;
  gst_rate: number | null;
  hsn_code: string | null;
  raw_ai_response: ParsedInvoiceData | null;
  status: InvoiceStatus;
  language_detected: string | null;
  created_at: string;
}

export type InvoiceStatus = "pending" | "matched" | "mismatch" | "missing" | "needs_review";

export interface InvoiceLineItem {
  description: string;
  hsn_code: string | null;
  quantity: number | null;
  unit_price: number | null;
  taxable_amount: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface ParsedInvoiceData {
  invoice_number: string | null;
  invoice_date: string | null;
  vendor_name: string | null;
  vendor_gstin: string | null;
  buyer_gstin: string | null;
  line_items: InvoiceLineItem[];
  subtotal: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_amount: number;
  language_detected: string;
  currency: "INR";
  confidence_score: number;
}

export interface InvoiceUploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// --- GSTR ---

export interface GSTR2BEntry {
  id: string;
  user_id: string;
  period: string;
  supplier_gstin: string;
  invoice_number: string;
  invoice_date: string;
  taxable_amount: number;
  igst: number;
  cgst: number;
  sgst: number;
  matched_invoice_id: string | null;
  match_status: MatchStatus;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export type MatchStatus = "unmatched" | "matched" | "partial_match" | "discrepancy";

export interface ReconciliationResult {
  period: string;
  total_entries: number;
  matched: number;
  unmatched: number;
  discrepancies: ReconciliationDiscrepancy[];
  summary: {
    total_itc_available: number;
    total_itc_matched: number;
    potential_itc_loss: number;
  };
}

export interface ReconciliationDiscrepancy {
  gstr2b_entry: GSTR2BEntry;
  matched_invoice: Invoice | null;
  discrepancy_type: "amount_mismatch" | "date_mismatch" | "gstin_mismatch" | "not_found";
  difference_amount: number;
}

// --- Compliance Dates ---

export interface ComplianceDate {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  filing_type: FilingType;
  status: ComplianceDateStatus;
  reminder_sent: boolean;
  created_at: string;
}

export type FilingType = "GSTR-1" | "GSTR-3B" | "GSTR-2B" | "ITR" | "TDS" | "custom";

export type ComplianceDateStatus = "pending" | "completed" | "overdue";

// --- Subscription ---

export interface Subscription {
  id: string;
  user_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  created_at: string;
}

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  highlighted?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Shuruat",
    price: 0,
    priceLabel: "मुफ्त / Free",
    features: [
      "10 invoices/month",
      "AI invoice parsing",
      "Basic compliance calendar",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Vyapaar",
    price: 199,
    priceLabel: "₹199/month",
    highlighted: true,
    features: [
      "Unlimited invoices",
      "GSTR-2B reconciliation",
      "WhatsApp reminders",
      "Voice input (Bhashini)",
      "Priority support",
    ],
  },
  {
    id: "ca",
    name: "CA Partner",
    price: 499,
    priceLabel: "₹499/month",
    features: [
      "Everything in Vyapaar",
      "20 client accounts",
      "Bulk reconciliation",
      "White-label reports",
      "Dedicated support",
    ],
  },
];

// --- CA Partner ---

export interface CAClient {
  id: string;
  ca_user_id: string;
  client_user_id: string;
  status: "pending" | "active" | "revoked";
  invited_email: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export interface CAInvite {
  id: string;
  ca_user_id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
  expires_at: string;
}

export interface CAClientSummary {
  relationshipId: string;
  clientUserId: string;
  profile: Pick<Profile, "full_name" | "business_name" | "gstin" | "phone">;
  invoicesThisMonth: number;
  pendingMismatches: number;
  nextDeadline: string | null;
  lastInvoiceDate: string | null;
  complianceScore: number;
}

// --- API Response ---

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// --- Dashboard ---

export interface DashboardStats {
  invoicesThisMonth: number;
  pendingMismatches: number;
  upcomingDeadlines: number;
  totalITCClaimed: number;
  complianceScore: number; // 0-100
}

// --- Form Types ---

export interface RegisterFormData {
  full_name: string;
  business_name: string;
  gstin: string;
  phone: string;
  email: string;
  password: string;
  language: IndianLanguage;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface InvoiceFilterParams {
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  vendorGstin?: string;
  page?: number;
  limit?: number;
}
