-- ============================================================
-- BharatCompliance — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id              uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name       text NOT NULL,
  gstin           text,
  business_name   text NOT NULL DEFAULT '',
  phone           text,
  language        text NOT NULL DEFAULT 'hi',
  plan            text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ca')),
  plan_expires_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_gstin CHECK (
    gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
  )
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, business_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'business_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_url          text NOT NULL,
  file_name         text NOT NULL,
  invoice_number    text,
  invoice_date      date,
  vendor_name       text,
  vendor_gstin      text,
  buyer_gstin       text,
  taxable_amount    numeric(14,2),
  cgst              numeric(14,2),
  sgst              numeric(14,2),
  igst              numeric(14,2),
  total_amount      numeric(14,2),
  gst_rate          numeric(5,2),
  hsn_code          text,
  raw_ai_response   jsonb,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','matched','mismatch','missing','needs_review')),
  language_detected text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own invoices"
  ON invoices FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_invoices_user_id    ON invoices(user_id);
CREATE INDEX idx_invoices_status     ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_vendor_gstin ON invoices(vendor_gstin);

-- ============================================================
-- GSTR-2B ENTRIES
-- ============================================================
CREATE TABLE gstr2b_entries (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  period                text NOT NULL,  -- YYYY-MM
  supplier_gstin        text NOT NULL,
  invoice_number        text NOT NULL,
  invoice_date          date,
  taxable_amount        numeric(14,2),
  igst                  numeric(14,2) DEFAULT 0,
  cgst                  numeric(14,2) DEFAULT 0,
  sgst                  numeric(14,2) DEFAULT 0,
  matched_invoice_id    uuid REFERENCES invoices(id),
  match_status          text NOT NULL DEFAULT 'unmatched'
                        CHECK (match_status IN ('unmatched','matched','partial_match','discrepancy')),
  raw_data              jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gstr2b_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own GSTR entries"
  ON gstr2b_entries FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_gstr2b_user_id     ON gstr2b_entries(user_id);
CREATE INDEX idx_gstr2b_period      ON gstr2b_entries(period);
CREATE INDEX idx_gstr2b_status      ON gstr2b_entries(match_status);
CREATE UNIQUE INDEX idx_gstr2b_unique
  ON gstr2b_entries(user_id, period, supplier_gstin, invoice_number);

-- ============================================================
-- COMPLIANCE DATES
-- ============================================================
CREATE TABLE compliance_dates (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title         text NOT NULL,
  description   text,
  due_date      date NOT NULL,
  filing_type   text NOT NULL DEFAULT 'custom'
                CHECK (filing_type IN ('GSTR-1','GSTR-3B','GSTR-2B','ITR','TDS','custom')),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','completed','overdue')),
  reminder_sent boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE compliance_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own compliance dates"
  ON compliance_dates FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_compliance_user_id  ON compliance_dates(user_id);
CREATE INDEX idx_compliance_due_date ON compliance_dates(due_date);
CREATE INDEX idx_compliance_status   ON compliance_dates(status);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  razorpay_order_id     text,
  razorpay_payment_id   text,
  plan                  text NOT NULL CHECK (plan IN ('free','pro','ca')),
  amount                numeric(10,2) NOT NULL,
  currency              text NOT NULL DEFAULT 'INR',
  status                text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','paid','failed')),
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS (run separately or via Supabase dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gstr-files', 'gstr-files', false);
--
-- CREATE POLICY "Users upload own invoices"
--   ON storage.objects FOR INSERT WITH CHECK (
--     bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
--
-- CREATE POLICY "Users view own invoices"
--   ON storage.objects FOR SELECT USING (
--     bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
