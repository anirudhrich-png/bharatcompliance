import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — BharatCompliance",
  description: "How BharatCompliance collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fefce8]" style={{ fontFamily: "var(--font-body)" }}>
      {/* Minimal nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f97316] font-display text-xs font-bold text-white">
              BC
            </div>
            <span className="font-display text-base font-semibold text-[#0f172a]">
              BharatCompliance
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <h1 className="mb-2 font-display text-3xl font-bold text-[#0f172a] sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mb-10 text-sm text-slate-400">Last updated: May 2026</p>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                1. Introduction
              </h2>
              <p>
                BharatCompliance (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is
                operated by Crazy rIch Labs. We are committed to protecting the privacy of Indian
                MSMEs and their financial data. This Privacy Policy explains what information we
                collect, how we use it, and your rights under the Digital Personal Data Protection
                Act, 2023 (DPDP Act) and applicable Indian laws.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                2. Information We Collect
              </h2>
              <p>We collect the following categories of information:</p>
              <ul className="mt-3 space-y-2 pl-5 list-disc">
                <li>
                  <strong>Account information:</strong> Name, email address, phone number, business
                  name, and GSTIN provided during registration.
                </li>
                <li>
                  <strong>Invoice data:</strong> Invoice images, PDFs, and the structured data
                  extracted from them (vendor names, GSTINs, amounts, HSN codes).
                </li>
                <li>
                  <strong>GSTR-2B data:</strong> GST reconciliation files you upload from the GST
                  portal.
                </li>
                <li>
                  <strong>Usage data:</strong> Pages visited, features used, and error logs for
                  improving the service.
                </li>
                <li>
                  <strong>Payment data:</strong> Transaction IDs and plan information. Card details
                  are processed by Razorpay and never stored on our servers.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                3. How We Store Your Data
              </h2>
              <p>
                All data is stored on Supabase (PostgreSQL), hosted on AWS infrastructure in the
                Asia Pacific (Mumbai) region. Your data is encrypted at rest using AES-256
                encryption and in transit using TLS 1.3. We enforce Row-Level Security (RLS) on all
                database tables — your data is completely isolated from other users and is never
                accessible to other accounts.
              </p>
              <p className="mt-3">
                Invoice files and GSTR uploads are stored in private Supabase Storage buckets with
                signed URLs that expire after 1 hour.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                4. How We Use Your Data
              </h2>
              <ul className="mt-3 space-y-2 pl-5 list-disc">
                <li>To provide GST invoice parsing and reconciliation services.</li>
                <li>To send compliance reminders via WhatsApp and email.</li>
                <li>To process your subscription payments via Razorpay.</li>
                <li>To improve the accuracy of our AI models (using anonymised, aggregated data only).</li>
                <li>To comply with applicable Indian tax and financial regulations.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                5. We Do Not Sell Your Data
              </h2>
              <p>
                We do not sell, rent, or trade your personal or financial data to any third party
                for marketing or advertising purposes. Your GST data, invoice details, and business
                information are yours — we are merely the custodian. We access your data only to
                provide the services you have signed up for.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                6. Third-Party Services
              </h2>
              <p>We use the following third-party services to operate BharatCompliance:</p>
              <ul className="mt-3 space-y-2 pl-5 list-disc">
                <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
                <li><strong>Anthropic Claude API</strong> — AI-powered invoice parsing.</li>
                <li><strong>Razorpay</strong> — payment processing.</li>
                <li><strong>Twilio</strong> — WhatsApp reminders.</li>
                <li><strong>Bhashini API (MeitY)</strong> — regional language voice processing.</li>
                <li><strong>Vercel</strong> — application hosting.</li>
              </ul>
              <p className="mt-3">
                Each service operates under its own privacy policy. Invoice data sent to Anthropic
                for parsing is subject to Anthropic&apos;s data processing terms. We do not store
                your data with Anthropic beyond the duration of an API call.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                7. DPDP Act Compliance
              </h2>
              <p>
                Under the Digital Personal Data Protection Act, 2023, you have the right to:
              </p>
              <ul className="mt-3 space-y-2 pl-5 list-disc">
                <li>Access the personal data we hold about you.</li>
                <li>Correct inaccurate or incomplete personal data.</li>
                <li>Request erasure of your personal data (right to be forgotten).</li>
                <li>Withdraw consent for data processing at any time.</li>
                <li>File a grievance with the Data Protection Board of India.</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at{" "}
                <a href="mailto:privacy@bharatcompliance.in" className="text-[#f97316] hover:underline">
                  privacy@bharatcompliance.in
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                8. Data Retention
              </h2>
              <p>
                We retain your data for as long as your account is active. If you delete your
                account, all personal data and uploaded files are permanently deleted within 30
                days. Anonymised, aggregated usage data (with no personally identifiable
                information) may be retained for analytics purposes.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                9. Contact Us
              </h2>
              <p>
                For any privacy-related questions or requests, please contact our Data Protection
                Officer at{" "}
                <a href="mailto:privacy@bharatcompliance.in" className="text-[#f97316] hover:underline">
                  privacy@bharatcompliance.in
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-400">
        <p>© 2026 Crazy rIch Labs · <Link href="/terms" className="hover:text-slate-600">Terms of Service</Link></p>
      </footer>
    </div>
  );
}
