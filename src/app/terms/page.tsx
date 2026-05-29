import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — BharatCompliance",
  description: "Terms and conditions for using BharatCompliance.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mb-10 text-sm text-slate-400">Last updated: May 2026</p>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using BharatCompliance (&ldquo;the Service&rdquo;), operated by
                Crazy rIch Labs (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you
                agree to be bound by these Terms of Service. If you do not agree to these terms,
                please do not use the Service. These Terms are governed by the laws of India and the
                Information Technology Act, 2000.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                2. Description of Service
              </h2>
              <p>
                BharatCompliance is a GST compliance SaaS platform for Indian MSMEs that provides:
              </p>
              <ul className="mt-3 space-y-2 pl-5 list-disc">
                <li>AI-powered invoice parsing and data extraction.</li>
                <li>GSTR-2B reconciliation and mismatch detection.</li>
                <li>GST compliance calendar and WhatsApp reminders.</li>
                <li>Tally XML and CSV export of invoice data.</li>
              </ul>
              <p className="mt-3">
                The Service is intended for use by Indian businesses, chartered accountants, and
                tax professionals. It is a tool to assist with GST compliance — it does not
                constitute professional tax advice.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                3. Account Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activity that occurs under your account. You must provide accurate and
                complete information during registration, including a valid GSTIN where applicable.
                You agree not to share your account with any third party without prior written
                consent from the Company.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                4. Subscription Plans and Payments
              </h2>
              <p>
                BharatCompliance offers the following plans:
              </p>
              <ul className="mt-3 space-y-2 pl-5 list-disc">
                <li><strong>Shuruat (Free):</strong> 10 invoices per month, no credit card required.</li>
                <li><strong>Vyapaar (₹199/month):</strong> Unlimited invoices, GSTR-2B reconciliation, WhatsApp reminders.</li>
                <li><strong>CA Partner (₹499/month):</strong> All Vyapaar features plus 20 client accounts.</li>
              </ul>
              <p className="mt-3">
                All payments are processed in Indian Rupees (INR) via Razorpay. Subscription fees
                are billed monthly or annually, as selected at the time of purchase. Prices are
                exclusive of applicable GST, which will be added at checkout.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                5. Refund Policy
              </h2>
              <p>
                We offer a <strong>7-day refund policy</strong> from the date of your first paid
                subscription. If you are unsatisfied with the Service within 7 days of your first
                payment, you may request a full refund by contacting{" "}
                <a href="mailto:support@bharatcompliance.in" className="text-[#f97316] hover:underline">
                  support@bharatcompliance.in
                </a>
                . Refunds are processed within 7–10 business days to the original payment method.
              </p>
              <p className="mt-3">
                After 7 days, subscription fees are non-refundable. Downgrading to the Free plan
                mid-cycle does not entitle you to a partial refund of the current billing period.
                Annual plans are refundable within 7 days of each annual renewal date.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                6. Acceptable Use
              </h2>
              <p>You agree not to use the Service to:</p>
              <ul className="mt-3 space-y-2 pl-5 list-disc">
                <li>Upload fraudulent, fictitious, or forged invoices.</li>
                <li>Attempt to circumvent or manipulate GST calculations.</li>
                <li>Reverse-engineer, scrape, or extract data from the platform by automated means.</li>
                <li>Violate any applicable Indian law, including the Income Tax Act, GST Act, or DPDP Act.</li>
                <li>Impersonate any person or entity, or misrepresent your GSTIN.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                7. Limitation of Liability
              </h2>
              <p>
                BharatCompliance is a tool to assist with GST compliance — it does not guarantee
                the accuracy of AI-extracted data. You are solely responsible for verifying all
                extracted data before filing returns with the GST portal. The Company shall not be
                liable for any penalties, interest, or losses arising from incorrect GST filings,
                missed deadlines, or reliance on AI-parsed data without verification.
              </p>
              <p className="mt-3">
                To the maximum extent permitted under Indian law, the Company&apos;s total liability
                to you for any claim arising under these Terms shall not exceed the total subscription
                fees paid by you in the 3 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                8. Intellectual Property
              </h2>
              <p>
                The Service, including its software, AI models, branding, and content, is the
                exclusive property of Crazy rIch Labs and is protected under Indian copyright and
                intellectual property law. You are granted a limited, non-exclusive, non-transferable
                licence to use the Service solely for your internal business purposes.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                9. Termination
              </h2>
              <p>
                Either party may terminate your account at any time. We reserve the right to suspend
                or terminate accounts that violate these Terms without prior notice. Upon termination,
                your data will be deleted within 30 days in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                10. Governing Law and Dispute Resolution
              </h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of India.
                Any dispute arising out of or relating to these Terms shall be subject to the
                exclusive jurisdiction of the courts of Bengaluru, Karnataka, India. In the event
                of a dispute, the parties agree to first attempt resolution through good-faith
                negotiation for a period of 30 days before initiating legal proceedings.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                11. Changes to These Terms
              </h2>
              <p>
                We reserve the right to modify these Terms at any time. Material changes will be
                notified via email or an in-app notice at least 14 days before taking effect.
                Continued use of the Service after changes take effect constitutes acceptance of
                the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-[#0f172a]">
                12. Contact
              </h2>
              <p>
                For questions about these Terms, contact us at{" "}
                <a href="mailto:legal@bharatcompliance.in" className="text-[#f97316] hover:underline">
                  legal@bharatcompliance.in
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-400">
        <p>© 2026 Crazy rIch Labs · <Link href="/privacy" className="hover:text-slate-600">Privacy Policy</Link></p>
      </footer>
    </div>
  );
}
