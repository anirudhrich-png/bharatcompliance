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
│   ├── (auth)/                      # Auth group — no sidebar layout
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                       # Authenticated app — sidebar + header layout
│   │   ├── layout.tsx               # AppLayout: Sidebar + Header + MobileNav
│   │   ├── dashboard/page.tsx
│   │   ├── invoice/
│   │   │   ├── upload/page.tsx
│   │   │   └── history/page.tsx
│   │   ├── gstr/page.tsx
│   │   ├── reminders/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── ca/
│   │   │   ├── page.tsx             # CA Partner Dashboard
│   │   │   └── [clientId]/page.tsx  # Client detail (CA-scoped read-only)
│   ├── invite/
│   │   └── page.tsx                 # Public invite acceptance page
│   ├── page.tsx                     # Public landing page
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   └── api/
│       ├── auth/register/           # POST — create user + profile
│       ├── ai/
│       │   ├── parse-invoice/       # POST — Claude invoice extraction
│       │   └── voice-parse/         # POST — text-to-invoice via Claude
│       ├── bhashini/transcribe/     # POST — voice ASR via Bhashini
│       ├── invoice/
│       │   ├── route.ts             # GET (list), POST (save)
│       │   ├── [id]/route.ts        # DELETE
│       │   └── export/
│       │       ├── csv/route.ts     # GET
│       │       └── tally/route.ts   # GET
│       ├── gstr/
│       │   ├── upload/route.ts      # POST
│       │   ├── reconcile/route.ts   # POST
│       │   ├── mismatches/route.ts  # GET
│       │   └── export/route.ts      # GET
│       ├── reminders/
│       │   ├── route.ts             # GET (list + auto-seed), POST (create)
│       │   ├── [id]/route.ts        # PATCH (status), DELETE
│       │   ├── send-whatsapp/       # POST
│       │   └── send-all-due/        # POST (cron endpoint)
│       ├── payments/
│       │   ├── create-order/        # POST
│       │   └── verify/              # POST
│       ├── profile/route.ts         # GET, PATCH
│       ├── notifications/route.ts   # GET
│       └── ca/
│           ├── invite/
│           │   ├── route.ts         # POST (create), GET (validate token)
│           │   ├── accept/route.ts  # POST
│           │   └── [inviteId]/      # DELETE (cancel pending invite)
│           └── clients/
│               ├── route.ts         # GET (list with stats)
│               └── [clientId]/      # GET (detail), DELETE (revoke)
├── components/
│   ├── ui/                          # shadcn components + use-toast.ts
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   ├── NotificationBell.tsx     # Bell dropdown (client component)
│   │   └── PageTransition.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── ComplianceAlert.tsx
│   │   ├── RecentActivity.tsx
│   │   └── InviteAcceptedBanner.tsx
│   ├── invoice/
│   │   ├── InvoiceUploadClient.tsx
│   │   ├── InvoiceHistoryClient.tsx
│   │   ├── UploadZone.tsx
│   │   ├── ParseResult.tsx
│   │   ├── VoiceInput.tsx
│   │   └── ExportDropdown.tsx
│   ├── gstr/
│   │   ├── GSTRPageClient.tsx
│   │   ├── GSTRUploadZone.tsx
│   │   └── MismatchTable.tsx
│   ├── reminders/
│   │   ├── RemindersPageClient.tsx
│   │   └── ComplianceCalendar.tsx
│   ├── ca/
│   │   ├── CADashboardClient.tsx
│   │   └── ClientDetailClient.tsx
│   ├── payments/
│   │   ├── PricingPlans.tsx
│   │   └── RazorpayCheckout.tsx
│   ├── settings/
│   │   ├── AccountSettingsClient.tsx
│   │   ├── SignOutButton.tsx
│   │   └── TallyGuide.tsx
│   └── landing/
│       └── LandingPage.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client + admin client
│   ├── claude/index.ts
│   ├── bhashini/index.ts
│   ├── razorpay/index.ts
│   ├── twilio/index.ts
│   ├── tally/index.ts
│   ├── utils/index.ts              # cn(), formatCurrency(), formatGSTIN(), formatDate()
│   └── validations/index.ts        # All Zod schemas
└── types/
    └── index.ts                    # All TypeScript interfaces
```

---

## Database Schema (Supabase)

### Tables

#### `profiles`
```sql
id            uuid references auth.users PRIMARY KEY
full_name     text NOT NULL
gstin         text UNIQUE              -- GST Identification Number
business_name text NOT NULL
phone         text
language      text DEFAULT 'hi'        -- Preferred language (hi, ta, te, mr, etc.)
plan          text DEFAULT 'free'      -- 'free' | 'pro' | 'ca'
plan_expires_at timestamptz
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
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
filing_type text                     -- 'GSTR-1'|'GSTR-3B'|'GSTR-2B'|'ITR'|'TDS'|'custom'
status      text DEFAULT 'pending'   -- 'pending'|'completed'|'overdue'
reminder_sent boolean DEFAULT false
created_at  timestamptz DEFAULT now()

CONSTRAINT unique_user_filing_due_date UNIQUE (user_id, filing_type, due_date)
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

#### `ca_clients`
```sql
id             uuid DEFAULT gen_random_uuid() PRIMARY KEY
ca_user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE
client_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE
status         text DEFAULT 'pending' CHECK (status IN ('pending','active','revoked'))
invited_email  text
invited_at     timestamptz DEFAULT now()
accepted_at    timestamptz
UNIQUE(ca_user_id, client_user_id)
```

#### `ca_invites`
```sql
id         uuid DEFAULT gen_random_uuid() PRIMARY KEY
ca_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE
email      text NOT NULL
token      text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text
status     text DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired'))
created_at timestamptz DEFAULT now()
expires_at timestamptz DEFAULT now() + interval '7 days'
```

### RLS Setup (run once per table)
```sql
-- All tables follow this pattern
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own data" ON <table>
  FOR ALL USING (auth.uid() = user_id);

-- ca_clients has two policies (CA owner + client viewer)
CREATE POLICY "CAs manage own clients" ON ca_clients FOR ALL USING (auth.uid() = ca_user_id);
CREATE POLICY "Clients see own CA relationships" ON ca_clients FOR SELECT USING (auth.uid() = client_user_id);
CREATE POLICY "CAs manage own invites" ON ca_invites FOR ALL USING (auth.uid() = ca_user_id);
```

### Storage Buckets
- `invoices` — private bucket, user invoices (PDFs, images)
- `gstr-files` — private bucket, GSTR-2B JSON uploads

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

### Full Route Reference
```
# Auth
POST /api/auth/register            → Create Supabase user + profiles row

# Invoices
GET  /api/invoice                  → List invoices (paginated)
POST /api/invoice                  → Save parsed invoice to DB
DELETE /api/invoice/[id]           → Delete invoice + storage file
POST /api/invoice/upload           → Upload file to Supabase Storage
GET  /api/invoice/export/csv       → All plans; query: dateFrom, dateTo, status
GET  /api/invoice/export/tally     → Pro/CA; query: dateFrom, dateTo, status

# AI
POST /api/ai/parse-invoice         → Send image/PDF to Claude, return structured JSON
POST /api/ai/voice-parse           → Convert transcribed text to invoice fields via Claude

# Bhashini
POST /api/bhashini/transcribe      → Voice audio → text via Bhashini ASR

# GSTR
POST /api/gstr/upload              → Upload + parse GSTR-2B JSON from GST portal
POST /api/gstr/reconcile           → Run matching algorithm (Pro/CA plan)
GET  /api/gstr/mismatches          → Get unmatched entries
GET  /api/gstr/export              → Download mismatch CSV (Pro/CA plan)

# Reminders / Compliance Calendar
GET  /api/reminders                → List dates; auto-seeds GSTR-1/3B/2B if none this month
POST /api/reminders                → Create custom compliance date
PATCH /api/reminders/[id]          → Update status: 'completed' | 'pending'
DELETE /api/reminders/[id]         → Delete compliance date
POST /api/reminders/send-whatsapp  → Send WhatsApp reminder (Pro plan; { reminderId } | { test: true })
POST /api/reminders/send-all-due   → Cron endpoint — sends all due-in-3-days (Bearer CRON_SECRET)

# Profile
GET  /api/profile                  → Current user profile
PATCH /api/profile                 → Update profile fields (phone, name, language, etc.)

# Payments (Razorpay)
POST /api/payments/create-order    → Create Razorpay order, return orderId
POST /api/payments/verify          → Verify payment signature, update profile.plan

# Notifications
GET  /api/notifications            → Recent client connections + upcoming deadlines ≤3 days

# CA Partner
POST   /api/ca/invite              → Create invite link (CA plan, max 20 clients)
GET    /api/ca/invite?token=xxx    → Validate token — public, no auth required
POST   /api/ca/invite/accept       → Accept invite (auth required), creates ca_clients row
DELETE /api/ca/invite/[inviteId]   → Cancel a pending invite (CA only)
GET    /api/ca/clients             → List active clients with per-client stats (CA plan)
DELETE /api/ca/clients/[clientId]  → Revoke client access
GET    /api/ca/clients/[clientId]  → Fetch client's invoices/compliance data (CA-scoped)
```

### Authentication
- Use Supabase Auth middleware (`src/middleware.ts`)
- All `/api/*` routes except `/api/auth/*` and `GET /api/ca/invite` require a valid session
- Use `createSupabaseServerClient()` in API routes — never the browser client
- Use `createSupabaseAdminClient()` only when bypassing RLS is intentional (e.g. reading another user's data in CA flows)

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
CRON_SECRET=<openssl rand -hex 32>   # Must also be set in Vercel env vars
```

### Wrapper
`src/lib/twilio/index.ts` — `sendWhatsAppMessage(phone, message)` and message formatters.

### Phone Number Format
- Stored in DB as 10-digit Indian number (e.g. `9876543210`)
- Twilio receives as `whatsapp:+919876543210`
- Displayed to users as `+91 9876543210`

### Vercel Cron Setup
`vercel.json` calls `/api/reminders/send-all-due` daily at 09:00 UTC (14:30 IST).
Add `CRON_SECRET` to Vercel Project → Settings → Environment Variables.
Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` with cron requests.

---

## Tally XML Export

### Library — `src/lib/tally/index.ts`
- `generateTallyXML(invoices)` → TallyPrime XML string (Purchase vouchers)
  - Date format: YYYYMMDD, Amounts: 2 d.p., XML-escaped vendor names
  - Debit: `ISDEEMEDPOSITIVE=Yes`, negative AMOUNT (purchase + tax inputs)
  - Credit: `ISDEEMEDPOSITIVE=No`, positive AMOUNT (party/vendor = total)
  - Voucher must balance: sum of all AMOUNT = 0
  - Skips invoices with null `taxable_amount` or null `invoice_date`
- `generateInvoiceCSV(invoices)` → UTF-8 BOM CSV (Excel-safe for Hindi text)

### Plan enforcement (export)
| Feature | Free | Pro | CA |
|---|---|---|---|
| Invoice CSV export | ✅ | ✅ | ✅ |
| Invoice Tally XML | ❌ | ✅ | ✅ |
| GSTR mismatch CSV | ❌ | ✅ | ✅ |

### Tally ledger prerequisites
Before importing XML into Tally, these ledgers must exist:
- `Purchases @5%` / `@12%` / `@18%` / `@28%` (under Purchases)
- `CGST Input`, `SGST Input`, `IGST Input` (under Duties & Taxes → GST)
- One sundry creditor ledger per vendor (under Sundry Creditors)

---

## Bhashini API Integration

### Endpoints
```
Base URL: https://dhruva-api.bhashini.gov.in/services/inference/pipeline
```

### Usage Pattern
- Used for voice-to-text on the invoice upload page (`VoiceInput.tsx`)
- Supported languages: Hindi (hi), Tamil (ta), Telugu (te), Marathi (mr), Bengali (bn), Gujarati (gu), Kannada (kn), Malayalam (ml)
- Always provide English fallback if Bhashini call fails
- Shows "Coming soon" tooltip when keys are not configured

---

## Subscription Plans

| Plan | Price | Limits |
|------|-------|--------|
| Free | ₹0/month | 10 invoices/month, no GSTR reconciliation |
| Pro | ₹199/month | Unlimited invoices, GSTR reconciliation, WhatsApp reminders |
| CA Plan | ₹499/month | Pro + 20 client accounts |

Plan value is stored in `profiles.plan` as `'free' | 'pro' | 'ca'`.

---

## GST Compliance Date Seeding

```typescript
const STANDARD_GST_DATES = [
  { title: "GSTR-1 Filing",    filing_type: "GSTR-1",  day: 11, useNextMonth: true  },
  { title: "GSTR-3B Filing",   filing_type: "GSTR-3B", day: 20, useNextMonth: true  },
  { title: "GSTR-2B Available",filing_type: "GSTR-2B", day: 14, useNextMonth: false },
];
```

- Seeding runs on `GET /api/reminders` if the user has **zero** compliance dates with `due_date >= start of current month`
- Uses `upsert` with `onConflict: 'user_id,filing_type,due_date', ignoreDuplicates: true` — safe to call concurrently
- The `UNIQUE (user_id, filing_type, due_date)` DB constraint is the final guard against duplicates

---

## Key Component Behaviours

### `CircularProgress` (`src/components/ui/circular-progress.tsx`)
- Font size auto-scales with `size` prop: `< 50px` → `text-[11px]`, `< 80px` → `text-base`, `≥ 80px` → `text-2xl`
- Text is centered via `absolute inset-0 flex items-center justify-center`
- Use `size={48} strokeWidth={3}` for mini rings (e.g. client cards); default `size={120} strokeWidth={10}` for dashboard

### `InviteAcceptedBanner` (`src/components/dashboard/InviteAcceptedBanner.tsx`)
- Rendered via `createPortal` into `document.body` — escapes the layout hierarchy
- Fixed position: `top: 0, left: 0, right: 0, z-index: 50, height: 56px`, background `#059669`
- Slide-down enter animation (`y: -56 → 0`), reverses on exit
- Countdown progress bar: `width: 100% → 0%` over 10 seconds
- Also renders a height-matched spacer div in the normal flow to push dashboard content down

### `NotificationBell` (`src/components/layout/NotificationBell.tsx`)
- Client component; fetches `GET /api/notifications` on mount
- Shows a numbered badge (count of unread notifications)
- Dropdown lists: new CA client connections (last 7 days) and compliance deadlines due in ≤3 days
- Closes on outside click

---

## CA Partner Dashboard

### Invite Flow
- **Logged-in user** hits `/invite?token=xxx` → server auto-accepts → redirects to `/dashboard?invite_accepted=true&ca_name=...`
- **Logged-out user**: `/invite` shows CTAs → `/register?invite=TOKEN` or `/login?invite=TOKEN`
- After login/register: auth pages detect `invite` param → call `POST /api/ca/invite/accept` → redirect to `/dashboard?invite_accepted=true&ca_name=...`
- Dashboard checks `invite_accepted=true` and renders `InviteAcceptedBanner` (10s auto-dismiss)

### Key Implementation Details
- `createSupabaseAdminClient()` used for all cross-user data reads (client invoices, profiles) — bypasses RLS with application-layer ownership check
- Sidebar + MobileNav show "Clients" link only when `profile.plan === 'ca'`
- Auth pages use `invite` query param (just the token) for the invite flow; `callbackUrl` still works for other post-auth redirects
- `useSearchParams()` wrapped in `<Suspense>` in both auth pages (Next.js static pre-render requirement)
- `src/app/invite/InviteAcceptButton.tsx` — dead file, no longer imported; server-side auto-accept replaced its role

---

## Code Style Rules

1. **No `any` types** — use `unknown` and type-guard
2. **No inline styles** — Tailwind classes only
3. **Server Components by default** — add `"use client"` only when needed (event handlers, hooks, browser APIs)
4. **Error boundaries** on every page
5. **Loading states** for every async operation — use `<Suspense>` with skeleton fallbacks
6. **Consistent naming:**
   - Components: PascalCase (`InvoiceCard.tsx`)
   - Hooks: camelCase with `use` prefix
   - Utils: camelCase (`formatCurrency.ts`)
   - API routes: kebab-case folders (`parse-invoice/`)
7. **Zod validation** on ALL API inputs — never trust raw request body
8. **Currency formatting:** Always use `formatCurrency(amount)` → `₹1,23,456.78` (Indian number system)

---

## Current Build Status

### ✅ Phase 1 — Foundation (COMPLETE)
- [x] Project scaffold & config
- [x] Supabase client setup (server + browser + admin clients)
- [x] Auth pages (login/register) — FloatingInput, Framer Motion, Supabase Auth
- [x] Dashboard shell (sidebar + header) — dark nav, layoutId indicator, mobile bottom nav, page transitions
- [x] Invoice upload page — step indicator, AI parse, save flow, PartyPopper success state
- [x] Claude API invoice parser — `claude-sonnet-4-20250514`, full GST extraction
- [x] Invoice list + detail view — searchable/filterable table, expandable rows, delete, CSV export

### ✅ Phase 1.5 — Visual Overhaul (COMPLETE)
- [x] Premium Indian fintech aesthetic (Zerodha × Linear × Razorpay style)
- [x] Count-up StatsCard animations (Framer Motion useMotionValue)
- [x] SVG circular progress ring — auto-scales text size for mini rings
- [x] Animated dashed SVG border on upload zone
- [x] Floating label inputs (CSS :placeholder-shown peer trick)
- [x] AnimatePresence page transitions via usePathname key
- [x] Mobile bottom nav with layoutId spring indicator
- [x] TypeScript strict — 0 type errors

### ✅ Phase 2 — Core GST Features (COMPLETE)
- [x] GSTR-2B upload + parsing (`POST /api/gstr/upload`)
- [x] Reconciliation algorithm (`POST /api/gstr/reconcile`, Pro/CA only)
- [x] Mismatch dashboard (`/gstr`) — side-by-side comparison, ITC-loss summary
- [x] Compliance calendar (`/reminders`) — auto-seeds GSTR-1/3B/2B per month, mark-complete, overdue highlighting
- [x] Duplicate-safe seeding — unique constraint + upsert guards on `compliance_dates`

### ✅ Phase 3 — Growth Features (COMPLETE)
- [x] Bhashini voice input — mic button + language selector on upload page, MediaRecorder ASR
- [x] Razorpay subscription flow — `/settings` pricing page, dynamic checkout.js, plan enforcement
- [x] WhatsApp reminder bot — Twilio, per-reminder send button (Pro), daily Vercel cron at 09:00 UTC
- [x] Tally XML export — TallyPrime Purchase voucher XML; CSV all plans, Tally XML Pro+CA; GSTR mismatch CSV

### ✅ Phase 4 — Mobile Responsiveness (COMPLETE)
- [x] Sidebar hidden on mobile, bottom nav with glassmorphism + safe-area insets
- [x] Header: NotificationBell dropdown with unread badge; GSTIN chip hidden on small screens
- [x] App layout: `pb-safe-nav md:pb-6 scroll-touch` for momentum scroll + safe area
- [x] Invoice upload: "Take Photo" camera capture button on mobile
- [x] Invoice history: filter bar scrolls horizontally on mobile
- [x] Global: `overflow-x: hidden`, iOS font-size 16px (prevents zoom), utility classes

### ✅ Phase 5 — Landing & Public Pages (COMPLETE)
- [x] Landing page (`/`) — full marketing page with all sections
- [x] Privacy policy (`/privacy`) and Terms of service (`/terms`)

### ✅ Phase 7 — CA Partner Dashboard (COMPLETE)
- [x] `/ca` — client grid with per-client stats, invite modal, pending invites with Cancel buttons, upgrade wall
- [x] `/ca/[clientId]` — read-only client detail with "CA View" badge
- [x] `/invite` — public invite acceptance; server auto-accepts for logged-in users
- [x] Full invite flow: logged-out users → register/login with `?invite=TOKEN` → auto-accept + banner
- [x] `InviteAcceptedBanner` — fixed-position full-width emerald banner, portal, countdown progress bar
- [x] `NotificationBell` — new client connections + upcoming deadlines, numbered badge

---

## Commands Reference

```bash
npm run dev          # Start dev server on localhost:3000
npm run type-check   # Run tsc --noEmit (run before every commit)
npm run build        # Production build
npm run lint         # ESLint
```

---

## When Adding a New Feature

1. Check this CLAUDE.md for where it belongs in the structure
2. Add the DB schema here if new tables are needed — include RLS policy
3. Add Zod schema to `src/lib/validations/index.ts`
4. Add TypeScript types to `src/types/index.ts`
5. Build API route first, then UI
6. Run `npm run type-check` — must stay at 0 errors
7. Update this file's Build Status checklist and Route Reference

---

## IMPORTANT — Never Do This

- ❌ Never hardcode API keys — always use `process.env`
- ❌ Never use the Supabase browser client in API routes
- ❌ Never skip Zod validation on API inputs
- ❌ Never use `console.log` for errors — use proper error objects
- ❌ Never store GST/financial data without RLS policies
- ❌ Never use `any` TypeScript type
- ❌ Never call Claude API from the client side — always via API routes
- ❌ Never insert into `compliance_dates` without upsert — use `onConflict: 'user_id,filing_type,due_date'`

---

## Claude Code Operating Instructions

### Before Every Task
1. Read this entire CLAUDE.md before writing a single line of code
2. Run `find src -name "*.ts" -o -name "*.tsx" | head -20` to orient 
   yourself in the current file structure
3. View the specific file you are about to edit BEFORE editing it
4. Never assume a file's content — always read it first

### Code Correctness Rules
- After every change, run: `npm run type-check` — fix ALL errors before 
  proceeding. Never leave TypeScript errors.
- Never use `any` type. Use `unknown` with type guards if needed.
- Never use `// @ts-ignore` or `// @ts-nocheck`
- Every API route MUST have try/catch that returns JSON even on crash
- Every API route MUST validate input with Zod before processing
- Always use `getSupabaseUser(request)` for auth in API routes — 
  never createSupabaseServerClient() alone (breaks Flutter app)
- Never call Claude API from client components — only from API routes

### Change Discipline
- Make ONE focused change at a time
- After each change: verify it builds, verify it works, then move on
- Never refactor working code while fixing a bug
- If you need to change more than 3 files for one task, stop and ask
  for confirmation before proceeding
- Always preserve existing functionality — do not remove features

### File Editing Rules
- Always use str_replace for targeted edits — never rewrite entire files
- Before editing: view the file, identify the exact lines to change
- After editing: view the file again to verify the change is correct
- If a file is over 200 lines, read it in sections before editing

### API Route Pattern (always follow this exactly)
export async function POST(request: Request) {
  try {
    const { user, supabase } = await getSupabaseUser(request);
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized', 
        code: 'UNAUTHORIZED' }, { status: 401 });
    }
    const body = await request.json();
    const validated = schema.safeParse(body);
    if (!validated.success) {
      return Response.json({ success: false, 
        error: validated.error.message }, { status: 400 });
    }
    // ... logic
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('[route-name]', error);
    return Response.json({ success: false, 
      error: 'Internal server error' }, { status: 500 });
  }
}

### Database Rules
- Always use Supabase admin client for cross-user operations
- Always use RLS-respecting user client for user-scoped operations
- Never expose service role key to client side
- Always handle Supabase errors: check .error not just .data

### Before Marking Any Task Complete
1. `npm run type-check` — must show 0 errors
2. `npm run lint` — must show 0 errors  
3. Verify the changed route/component works end to end
4. Update the Build Status section in this CLAUDE.md
5. Write a clear summary of what changed and why

### Never Do Without Asking First
- Delete or rename existing files
- Change database schema
- Modify middleware.ts or auth flow
- Change environment variable names
- Upgrade package versions
- Modify the Supabase client setup files
