import { z } from "zod";

// GSTIN validator
const gstinSchema = z
  .string()
  .length(15, "GSTIN must be exactly 15 characters")
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
    "Invalid GSTIN format"
  )
  .transform((val) => val.toUpperCase());

// Auth
export const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  business_name: z.string().min(2, "Business name required").max(200),
  gstin: gstinSchema,
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  language: z.enum(["en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "or", "as"]),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Invoice
export const invoiceUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z
    .number()
    .max(10 * 1024 * 1024, "File size must be under 10MB"),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  base64Data: z.string().min(1),
});

export const invoiceSaveSchema = z.object({
  file_url: z.string(), // URL for file uploads; "voice-input" sentinel for voice entries
  file_name: z.string(),
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  vendor_name: z.string().nullable(),
  vendor_gstin: z.string().nullable(),
  buyer_gstin: z.string().nullable(),
  taxable_amount: z.number().nullable(),
  cgst: z.number().nullable(),
  sgst: z.number().nullable(),
  igst: z.number().nullable(),
  total_amount: z.number().nullable(),
  gst_rate: z.number().nullable(),
  hsn_code: z.string().nullable(),
  raw_ai_response: z.record(z.unknown()).nullable(),
  language_detected: z.string().nullable(),
});

export const invoiceFilterSchema = z.object({
  status: z
    .enum(["pending", "matched", "mismatch", "missing", "needs_review"])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  vendorGstin: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GSTR
export const gstr2bUploadSchema = z.object({
  // Optional: if omitted the route extracts period from jsonData.fp
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Period must be in YYYY-MM format")
    .optional(),
  jsonData: z.string().min(1, "GSTR-2B JSON data is required"),
});

// Profile update
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  business_name: z.string().min(2).max(200).optional(),
  gstin: gstinSchema.optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional(),
  language: z
    .enum(["en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "or", "as"])
    .optional(),
});

// Compliance date
export const complianceDateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  filing_type: z.enum(["GSTR-1", "GSTR-3B", "GSTR-2B", "ITR", "TDS", "custom"]),
});

// CA Partner
export const caInviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const caInviteAcceptSchema = z.object({
  token: z.string().uuid("Invalid invite token"),
});

export type CAInviteInput = z.infer<typeof caInviteSchema>;
export type CAInviteAcceptInput = z.infer<typeof caInviteAcceptSchema>;

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type InvoiceUploadInput = z.infer<typeof invoiceUploadSchema>;
export type InvoiceSaveInput = z.infer<typeof invoiceSaveSchema>;
export type GSTR2BUploadInput = z.infer<typeof gstr2bUploadSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ComplianceDateInput = z.infer<typeof complianceDateSchema>;
