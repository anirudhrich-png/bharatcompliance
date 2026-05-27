# BharatCompliance — Setup Guide

## Step 1: Get the project on your Mac

Copy the project to your development folder:
```bash
cp -r /path/to/bharatcompliance ~/projects/bharatcompliance
cd ~/projects/bharatcompliance
```

## Step 2: Install dependencies
```bash
npm install
```

## Step 3: Set up Supabase

1. Go to https://supabase.com → New Project
2. Name it "bharatcompliance", pick a strong password, choose Mumbai (ap-south-1) region
3. Wait for it to provision (~2 mins)
4. Go to Settings → API → copy:
   - Project URL
   - anon (public) key
   - service_role key (keep secret!)
5. Go to SQL Editor → paste the contents of `docs/supabase-schema.sql` → Run
6. Go to Storage → Create two buckets:
   - `invoices` (private)
   - `gstr-files` (private)

## Step 4: Set up environment variables
```bash
cp .env.local.example .env.local
```
Then fill in your actual keys in `.env.local`

## Step 5: Get API keys

**Anthropic (Claude):**
- Go to https://console.anthropic.com
- Create an API key
- Paste in .env.local as ANTHROPIC_API_KEY

**Razorpay:**
- Go to https://dashboard.razorpay.com → Settings → API Keys
- Generate test mode keys
- Paste in .env.local

**Bhashini (optional for Phase 1):**
- Register at https://bhashini.gov.in/api-access
- Get API key and User ID

## Step 6: Run the dev server
```bash
npm run dev
```
Visit http://localhost:3000

## Step 7: Use Claude Code to continue building

In your terminal:
```bash
cd ~/projects/bharatcompliance
claude
```

Claude Code will read CLAUDE.md automatically and know:
- The entire architecture
- What's been built
- What to build next
- All the rules and conventions

### Example Claude Code commands:
```
> Build the auth pages (login and register) following the design system in CLAUDE.md
> Build the dashboard layout with sidebar and header
> Build the invoice upload page with drag-and-drop
> Connect the invoice upload to the Claude API parser
> Build the GSTR-2B reconciliation page
```

## Current Build Status
See CLAUDE.md → "Current Build Status" section for what's done vs pending.
