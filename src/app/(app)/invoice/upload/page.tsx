import { InvoiceUploadClient } from "@/components/invoice/InvoiceUploadClient";

export default function InvoiceUploadPage() {
  const bhashiniEnabled = !!(
    process.env.BHASHINI_API_KEY && process.env.BHASHINI_USER_ID
  );
  return <InvoiceUploadClient bhashiniEnabled={bhashiniEnabled} />;
}
