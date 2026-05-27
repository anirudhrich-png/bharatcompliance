import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in Indian number system (₹1,23,456.78)
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "₹—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date for Indian display (DD MMM YYYY)
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

// Format GSTIN for display (XX-XXXXX-XXXX-X-X-X)
export function formatGSTIN(gstin: string | null | undefined): string {
  if (!gstin) return "—";
  // GSTIN: 2 state + 10 PAN + 1 entity + 1 Z + 1 check
  return gstin.toUpperCase();
}

// Validate GSTIN format
export function isValidGSTIN(gstin: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
}

// Get state name from GSTIN prefix
export function getStateFromGSTIN(gstin: string): string {
  const stateCode = parseInt(gstin.substring(0, 2));
  const states: Record<number, string> = {
    1: "Jammu & Kashmir", 2: "Himachal Pradesh", 3: "Punjab",
    4: "Chandigarh", 5: "Uttarakhand", 6: "Haryana", 7: "Delhi",
    8: "Rajasthan", 9: "Uttar Pradesh", 10: "Bihar", 11: "Sikkim",
    12: "Arunachal Pradesh", 13: "Nagaland", 14: "Manipur",
    15: "Mizoram", 16: "Tripura", 17: "Meghalaya", 18: "Assam",
    19: "West Bengal", 20: "Jharkhand", 21: "Odisha", 22: "Chhattisgarh",
    23: "Madhya Pradesh", 24: "Gujarat", 25: "Daman & Diu",
    26: "Dadra & Nagar Haveli", 27: "Maharashtra", 28: "Andhra Pradesh",
    29: "Karnataka", 30: "Goa", 31: "Lakshadweep", 32: "Kerala",
    33: "Tamil Nadu", 34: "Puducherry", 35: "Andaman & Nicobar",
    36: "Telangana", 37: "Andhra Pradesh (new)", 38: "Ladakh",
    97: "Other Territory", 99: "Centre Jurisdiction",
  };
  return states[stateCode] || "Unknown";
}

// Get compliance status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "text-amber-600 bg-amber-50 border-amber-200",
    matched: "text-emerald-600 bg-emerald-50 border-emerald-200",
    mismatch: "text-red-600 bg-red-50 border-red-200",
    missing: "text-gray-600 bg-gray-50 border-gray-200",
    needs_review: "text-blue-600 bg-blue-50 border-blue-200",
    completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
    overdue: "text-red-600 bg-red-50 border-red-200",
  };
  return colors[status] || "text-gray-600 bg-gray-50 border-gray-200";
}

// Calculate days until due date
export function daysUntilDue(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);
  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Truncate file name for display
export function truncateFileName(name: string, maxLength = 30): string {
  if (name.length <= maxLength) return name;
  const ext = name.split(".").pop() || "";
  const base = name.slice(0, maxLength - ext.length - 4);
  return `${base}...${ext}`;
}

// Generate compliance dates for the current quarter
export function generateComplianceDates(year: number, month: number) {
  const dates = [];
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;

  dates.push({
    title: "GSTR-1 Filing",
    due_date: `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-11`,
    filing_type: "GSTR-1" as const,
    description: `GSTR-1 for ${new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
  });

  dates.push({
    title: "GSTR-3B Filing",
    due_date: `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-20`,
    filing_type: "GSTR-3B" as const,
    description: `GSTR-3B for ${new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
  });

  return dates;
}
