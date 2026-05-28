# BharatCompliance — CLAUDE.md
> This file is the authoritative reference for Claude Code when working on this project.
> Read this file completely before making ANY changes.

---

## Project Overview
**BharatCompliance** is a voice-first, regional-language AI co-pilot for Indian MSMEs.
It automates invoice extraction, GST reconciliation (GSTR-2B matching), and compliance reminders.

**Target users:** Small shopkeepers, traders, local manufacturers in Tier 2/3 Indian cities who are
WhatsApp-native but accounting-illiterate.

**Core value prop:** Upload an invoice (image/PDF) in any Indian language → AI extracts all data →
flags GST mismatches → sends WhatsApp reminders before deadlines.

---

## Tech Stack (NEVER deviate from this)

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, server components, API routes |
| Language | TypeScript (strict mode) | Type safety everywhere |
| Styling | Tailwind CSS + shadcn/ui | Consistent, accessible components |
| Database | Supabase (PostgreSQL) | Auth + DB + Storage in one |
| AI Engine | Anthropic Claude API (claude-sonnet-4-20250514) | Invoice parsing, GST logic |
| Payments | Razorpay | Indian payment standard |
| WhatsApp | Twilio | WhatsApp Business API for reminders |
| Language | Bhashini API | Regional language voice/text |
| State | Zustand | Lightweight global state |
| Forms | React Hook Form + Zod | Validated forms |
| Animation | Framer Motion | Smooth transitions |
| Deployment | Vercel | Zero-config Next.js hosting |

---

## Design System

### Color Palette
```css
--saffron: #f97316   /* Primary brand - Indian saffron */
--deep-green: #059669 /* Secondary - Indian flag green */
--navy: #0f172a       /* Dark backgrounds */
--cream: #fefce8      /* Warm off-white backgrounds */
--gold: #eab308       /* Accent for important callouts */
```

### Aesthetic Direction
- **Tone:** Professional-warm. Think: trusted CA firm meets modern fintech.
- **NOT:** Corporate cold blue/grey. NOT: generic SaaS purple.
- **Typography:** Display font for headings (Sora or Nunito), readable body (DM Sans)
- **Feel:** Clean, trustworthy, fast. Confident like a well-run Indian business.
- Dark sidebar + light main content area.
- Use subtle grain texture on hero sections.
- Cards with very slight warm shadows (amber/orange tinted).

### Component Rules
- All UI components live in `src/components/ui/` (shadcn pattern)
- Page-level components in `src/components/[feature]/`
- Every interactive element must have a loading state
- Every form must show validation errors inline (not toast-only)
- Skeleton loaders for all data-fetching states

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth group - no sidebar layout
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/           # Main dashboard
│   ├── invoice/
│   │   ├── upload/          # Upload + AI parse
│   │   └── history/         # All invoices
│   ├── gstr/                # GSTR-2B reconciliation
│   ├── reminders/           # Compliance calendar
│   ├── settings/            # Profile, subscription, billing
│   └── api/
│       ├── auth/            # Auth endpoints
│       ├── invoice/         # Invoice CRUD + file upload
│       ├── gstr/            # GSTR reconciliation logic
│       └── ai/              # Claude API calls
│           ├── parse-invoice/
│           └── reconcile/
├── components/
│   ├── ui/                  # shadcn components
│   ├── layout/              # Sidebar, Header, Shell
│   ├── invoice/             # InvoiceCard, UploadZone, ParseResult
│   └── dashboard/           # StatsCard, ComplianceAlert, RecentActivity
├── lib/
│   ├── supabase/            # Supabase client (server + browser)
│   ├── claude/              # Claude API wrapper
│   ├── bhashini/            # Bhashini API wrapper
│   ├── razorpay/            # Razorpay helpers
│   ├── utils/               # cn(), formatCurrency(), formatDate()
│   ├── hooks/               # useInvoices, useGSTR, useUser
│   └── validations/         # Zod schemas
└── types/
    └── index.ts             # All TypeScript interfaces
```

---

## Database Schema (Supabase)

### Tables

#### `profiles`
```sql
id          uuid references auth.users PRIMARY KEY
full_name   text NOT NULL
gstin       text UNIQUE              -- GST Identification Number
business_name text NOT NULL
phone       text
language    text DEFAULT 'hi'        -- Preferred language (hi, ta, te, mr, etc.)
plan        text DEFAULT 'free'      -- 'free' | 'pro'
plan_expires_at timestamptz
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

#### `invoices`
```sql
id            uuid DEFAULT gen_random_uuid() PRIMARY KEY
user_id       uuid references profiles(id) ON DELETE CASCADE
file_url      text                    -- Supabase Storage URL
file_name     text
invoice_number text
invoice_date  date
vendor_name   text
vendor_gstin  text
buyer_gstin   text
taxable_amount numeric(12,2)
cgst          numeric(12,2)
sgst          numeric(12,2)
igst          numeric(12,2)
total_amount  numeric(12,2)
gst_rate      numeric(5,2)
hsn_code      text
raw_ai_response jsonb               -- Full Claude response for debugging
status        text DEFAULT 'pending' -- 'pending'|'matched'|'mismatch'|'missing'
language_detected text
created_at    timestamptz DEFAULT now()
```

#### `gstr2b_entries`
```sql
id            uuid DEFAULT gen_random_uuid() PRIMARY KEY
user_id       uuid references profiles(id) ON DELETE CASCADE
period        text NOT NULL           -- e.g. "2024-12" (YYYY-MM)
supplier_gstin text NOT NULL
invoice_number text NOT NULL
invoice_date  date
taxable_amount numeric(12,2)
igst          numeric(12,2)
cgst          numeric(12,2)
sgst          numeric(12,2)
matched_invoice_id uuid references invoices(id)
match_status  text DEFAULT 'unmatched'
raw_data      jsonb
created_at    timestamptz DEFAULT now()
```

#### `compliance_dates`
```sql
id          uuid DEFAULT gen_random_uuid() PRIMARY KEY
user_id     uuid references profiles(id) ON DELETE CASCADE
title       text NOT NULL
description text
due_date    date NOT NULL
filing_type text                     -- 'GSTR-1'|'GSTR-3B'|'ITR'|'TDS'|'custom'
status      text DEFAULT 'pending'   -- 'pending'|'completed'|'overdue'
reminder_sent boolean DEFAULT false
created_at  timestamptz DEFAULT now()
```

#### `subscriptions`
```sql
id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY
user_id             uuid references profiles(id) ON DELETE CASCADE
razorpay_order_id   text
razorpay_payment_id text
plan                text NOT NULL
amount              numeric(10,2)
currency            text DEFAULT 'INR'
status              text DEFAULT 'pending'
created_at          timestamptz DEFAULT now()
```

---

## API Conventions

### Response Format
ALL API routes must return this shape:
```typescript
// Success
{ success: true, data: T, message?: string }

// Error
{ success: false, error: string, code?: string }
```

### Route Structure
```
POST /api/invoice/upload       → Upload file to Supabase Storage
POST /api/ai/parse-invoice     → Send to Claude, return structured data
POST /api/invoice              → Save parsed invoice to DB
GET  /api/invoice              → List invoices (paginated)
POST /api/gstr/upload          → Upload GSTR-2B JSON
POST /api/gstr/reconcile       → Run matching algorithm
GET  /api/gstr/mismatches      → Get unmatched entries
```

### Authentication
- Use Supabase Auth middleware (src/middleware.ts)
- All `/api/*` routes except `/api/auth/*` require valid session
- Use `createSupabaseServerClient()` in API routes — never the browser client

---

## Claude API Integration

### Model
Always use: `claude-sonnet-4-20250514`

### Invoice Parsing Prompt Template
```typescript
const INVOICE_PARSE_PROMPT = `
You are an expert Indian GST accountant and OCR assistant.
Extract the following information from this invoice image/document.
Return ONLY valid JSON, no explanation, no markdown fences.

Required fields:
{
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "vendor_name": string | null,
  "vendor_gstin": string | null,       // 15-char GSTIN format
  "buyer_gstin": string | null,
  "line_items": [{
    "description": string,
    "hsn_code": string | null,
    "quantity": number | null,
    "unit_price": number | null,
    "taxable_amount": number,
    "gst_rate": number,               // e.g. 18 for 18%
    "cgst": number,
    "sgst": number,
    "igst": number,
    "total": number
  }],
  "subtotal": number,
  "total_cgst": number,
  "total_sgst": number,
  "total_igst": number,
  "total_amount": number,
  "language_detected": string,         // e.g. "Hindi", "Tamil", "English"
  "currency": "INR",
  "confidence_score": number           // 0-1, your confidence in extraction accuracy
}

Important rules:
- GSTIN is always 15 characters: 2 digits + 10 char PAN + 1 digit + 1 char + 1 char
- GST rates in India are: 0%, 5%, 12%, 18%, 28% only
- If IGST is present, CGST and SGST should be 0 (interstate transaction)
- If CGST + SGST are present, IGST should be 0 (intrastate transaction)
- Dates should be converted to YYYY-MM-DD format regardless of input format
- All monetary values should be numbers (not strings)
- If a field cannot be determined, use null
`;
```

### Error Handling for Claude
- Always wrap in try/catch
- If confidence_score < 0.6, flag invoice as "needs_review"
- Log raw responses to `invoices.raw_ai_response` for debugging

---

## Twilio WhatsApp Integration

### Environment Variables
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=+14155238886   # Sandbox or approved sender
CRON_SECRET=<openssl rand -hex 32>   # Add to Vercel env vars too
```

### Wrapper
`src/lib/twilio/index.ts` — `sendWhatsAppMessage(phone, message)` and message formatters.

### API Routes
```
POST /api/reminders/send-whatsapp   → { reminderId } or { test: true }
                                       Pro plan required. Marks reminder_sent=true.
POST /api/reminders/send-all-due    → Protected by Authorization: Bearer CRON_SECRET
                                       Finds pending reminders due ≤3 days. Sends to Pro users with phone.
GET  /api/profile                   → Current user profile
PATCH /api/profile                  → Update profile fields (phone, name, etc.)
```

### Vercel Cron Setup
`vercel.json` is configured to call `/api/reminders/send-all-due` daily at 09:00 UTC (14:30 IST).
Add `CRON_SECRET` to Vercel Project → Settings → Environment Variables.
Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` with cron requests.

### Phone Number Format
- Stored in DB as 10-digit Indian number (e.g. `9876543210`)
- Twilio receives as `whatsapp:+919876543210`
- Displayed to users as `+91 9876543210`

---

## Bhashini API Integration

### Endpoints
```
Base URL: https://dhruva-api.bhashini.gov.in/services/inference/pipeline
```

### Usage Pattern
- Use for: voice-to-text input on the invoice upload page
- Supported languages: Hindi (hi), Tamil (ta), Telugu (te), Marathi (mr), Bengali (bn), Gujarati (gu), Kannada (kn), Malayalam (ml)
- Always provide English fallback if Bhashini call fails

---

## Supabase Setup

### Client Files Required
```
src/lib/supabase/client.ts     → Browser client (for client components)
src/lib/supabase/server.ts     → Server client (for API routes, server components)
src/middleware.ts              → Auth session refresh
```

### Storage Buckets
- `invoices` — private bucket, user invoices (PDFs, images)
- `gstr-files` — private bucket, GSTR-2B JSON uploads

### Row Level Security (RLS)
ALL tables must have RLS enabled:
```sql
-- Users can only see their own data
CREATE POLICY "Users see own data" ON invoices
  FOR ALL USING (auth.uid() = user_id);
```

---

## Subscription Plans

| Plan | Price | Limit |
|------|-------|-------|
| Free | ₹0/month | 10 invoices/month, no GSTR reconciliation |
| Pro | ₹199/month | Unlimited invoices, GSTR reconciliation, WhatsApp reminders |
| CA Plan | ₹499/month | Pro + 20 client accounts |

---

## GST Compliance Dates (Pre-populate for new users)

```typescript
const STANDARD_GST_DATES = [
  { title: "GSTR-1 Filing", filing_type: "GSTR-1", day: 11 },   // 11th of next month
  { title: "GSTR-3B Filing", filing_type: "GSTR-3B", day: 20 }, // 20th of next month
  { title: "GSTR-2B Available", filing_type: "GSTR-2B", day: 14 }, // 14th of current month
];
```

---

## Code Style Rules

1. **No `any` types** — use `unknown` and type-guard
2. **No inline styles** — Tailwind classes only
3. **Server Components by default** — add `"use client"` only when needed (event handlers, hooks, browser APIs)
4. **Error boundaries** on every page
5. **Loading states** for every async operation — use `<Suspense>` with skeleton fallbacks
6. **Consistent naming:**
   - Components: PascalCase (`InvoiceCard.tsx`)
   - Hooks: camelCase with `use` prefix (`useInvoices.ts`)
   - Utils: camelCase (`formatCurrency.ts`)
   - API routes: kebab-case folders (`parse-invoice/`)
7. **Zod validation** on ALL API inputs — never trust raw request body
8. **Currency formatting:** Always use `formatCurrency(amount)` → `₹1,23,456.78` (Indian number system)

---

## Current Build Status

### ✅ Phase 1 — Foundation (COMPLETE)
- [x] Project scaffold & config
- [x] CLAUDE.md
- [x] Supabase client setup (server + browser + admin clients)
- [x] Auth pages (login/register) — FloatingInput, Framer Motion, Supabase Auth
- [x] Dashboard shell (sidebar + header) — dark nav, layoutId indicator, mobile bottom nav, page transitions
- [x] Invoice upload page — step indicator, AI parse, save flow, PartyPopper success state
- [x] Claude API invoice parser — parse-invoice route, `claude-sonnet-4-20250514`, full GST extraction
- [x] Invoice list + detail view (`/invoice/history` — searchable/filterable table, expandable rows, delete, CSV export)

### ✅ Phase 1.5 — Visual Overhaul (COMPLETE)
- [x] Premium Indian fintech aesthetic (Zerodha × Linear × Razorpay style)
- [x] Count-up StatsCard animations (Framer Motion useMotionValue)
- [x] SVG circular progress ring for compliance score
- [x] Animated dashed SVG border on upload zone
- [x] Floating label inputs (CSS :placeholder-shown peer trick)
- [x] AnimatePresence page transitions via usePathname key
- [x] Mobile bottom nav with layoutId spring indicator
- [x] TypeScript strict — 0 type errors

### ✅ Phase 2 — Core GST Features (COMPLETE)
- [x] Invoice list + detail view (`/invoice/history`) — searchable/filterable table, expandable rows, delete, CSV export
- [x] GSTR-2B upload + parsing (`POST /api/gstr/upload`, parses B2B entries from GST portal JSON)
- [x] Reconciliation algorithm (`POST /api/gstr/reconcile`, matches on GSTIN+invoice_number, flags amount/date discrepancies)
- [x] Mismatch dashboard (`/gstr`, `GET /api/gstr/mismatches`, side-by-side comparison with ITC-loss summary)
- [x] Compliance calendar (`/reminders`, auto-populates GSTR-1/3B/2B dates, mark-complete, overdue highlighting)

### ✅ Phase 3 — Growth Features (PARTIAL)
- [x] Bhashini voice input — mic button + language selector on upload page, MediaRecorder ASR via `/api/bhashini/transcribe`, text→invoice via `/api/ai/voice-parse`, "Coming soon" tooltip when keys not configured
- [x] Razorpay subscription flow — `/settings` pricing page (Free/Vyapaar/CA), dynamic checkout.js load, `/api/payments/create-order` + `verify`, plan enforcement on `/api/gstr/reconcile` (403 for free), GSTR upgrade wall
- [x] WhatsApp reminder bot — Twilio integration, per-reminder send button (Pro only), locked icon for free, cron job sends all due-in-3-days reminders daily at 9 AM UTC, test message from Settings
- [ ] Multi-client (CA plan)

### ✅ Phase 4 — Mobile Responsiveness (COMPLETE)
- [x] Sidebar hidden on mobile (`md:hidden`), bottom nav visible on mobile (`md:hidden`)
- [x] Glassmorphism bottom nav with safe-area insets (`env(safe-area-inset-bottom)`) and 44px touch targets
- [x] Header responsive padding, date hidden below 380px (`.hide-xs`), bell 44px touch target
- [x] App layout: `pb-safe-nav md:pb-6 scroll-touch` for momentum scroll + safe area
- [x] Invoice upload: "Take Photo" camera capture button (`md:hidden`, `accept="image/*" capture="environment"`)
- [x] Invoice history: filter bar scrolls horizontally on mobile (no wrapping overflow)
- [x] Reminders: header stacks vertically on mobile, form inputs full-width stacked
- [x] Global: `overflow-x: hidden` on html/body, iOS font-size 16px (prevents zoom), utility classes (`.pb-safe-nav`, `.scroll-touch`, `.scroll-x-touch`, `.hide-xs`)

---

## Commands Reference

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Type checking (run before committing)
npm run type-check

# Build for production
npm run build

# Lint
npm run lint
```

---

## When Adding a New Feature

1. Check this CLAUDE.md for where it belongs in the structure
2. Add the DB schema here if new tables are needed
3. Add Zod schema to `src/lib/validations/`
4. Add TypeScript types to `src/types/index.ts`
5. Build API route first, then UI
6. Update the Build Status checklist above

---

## IMPORTANT — Never Do This

- ❌ Never hardcode API keys — always use `process.env`
- ❌ Never use the Supabase browser client in API routes
- ❌ Never skip Zod validation on API inputs
- ❌ Never use `console.log` for errors — use proper error objects
- ❌ Never store GST/financial data without RLS policies
- ❌ Never use `any` TypeScript type
- ❌ Never call Claude API from the client side — always via API routes
