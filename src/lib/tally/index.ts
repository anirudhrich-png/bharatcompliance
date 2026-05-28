import type { Invoice } from "@/types";

// Escape XML special characters in text content
function escXML(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Tally date format: YYYYMMDD (no separators)
function tallyDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "");
}

// Fixed 2 decimal places for Tally amounts
function amt(value: number | null | undefined): string {
  return (value ?? 0).toFixed(2);
}

function buildVoucher(invoice: Invoice): string {
  const taxable = invoice.taxable_amount ?? 0;
  const cgst = invoice.cgst ?? 0;
  const sgst = invoice.sgst ?? 0;
  const igst = invoice.igst ?? 0;
  const total = invoice.total_amount ?? taxable + cgst + sgst + igst;
  const isIGST = igst > 0;

  const partyName = escXML(invoice.vendor_name ?? "Unknown Vendor");
  const voucherNum = escXML(invoice.invoice_number ?? invoice.id);
  const narration = escXML(
    `GST Purchase - ${invoice.vendor_gstin ?? "No GSTIN"} - ${invoice.file_name}`
  );
  const purchaseLedger = invoice.gst_rate
    ? `Purchases @${invoice.gst_rate}%`
    : "Purchases";

  // Debit entries (ISDEEMEDPOSITIVE=Yes, negative amounts)
  // Credit entry (ISDEEMEDPOSITIVE=No, positive amount)
  const ledgerEntries: string[] = [
    // Purchase expense — Dr
    `<ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${escXML(purchaseLedger)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>-${amt(taxable)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>`,
  ];

  if (isIGST) {
    ledgerEntries.push(
      `<ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>IGST Input</LEDGERNAME>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <AMOUNT>-${amt(igst)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>`
    );
  } else {
    if (cgst > 0) {
      ledgerEntries.push(
        `<ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>CGST Input</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${amt(cgst)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
      );
    }
    if (sgst > 0) {
      ledgerEntries.push(
        `<ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>SGST Input</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${amt(sgst)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
      );
    }
  }

  // Party/vendor — Cr (amount owed)
  ledgerEntries.push(
    `<ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${partyName}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${amt(total)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>`
  );

  return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER VCHTYPE="Purchase" ACTION="Create">
    <DATE>${tallyDate(invoice.invoice_date)}</DATE>
    <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
    <VOUCHERNUMBER>${voucherNum}</VOUCHERNUMBER>
    <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
    <NARRATION>${narration}</NARRATION>
    ${ledgerEntries.join("\n    ")}
  </VOUCHER>
</TALLYMESSAGE>`;
}

export function generateTallyXML(invoices: Invoice[]): string {
  // Skip invoices without a taxable amount — can't build a balanced voucher
  const valid = invoices.filter(
    (inv) => inv.taxable_amount !== null && inv.invoice_date
  );

  const vouchers = valid.map(buildVoucher).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>##SVCURRENTCOMPANY</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${vouchers}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

// CSV with UTF-8 BOM so Excel opens Indian-language text correctly
export function generateInvoiceCSV(invoices: Invoice[]): string {
  const BOM = "﻿";
  const headers = [
    "Invoice Number",
    "Invoice Date",
    "Vendor Name",
    "Vendor GSTIN",
    "Buyer GSTIN",
    "Taxable Amount",
    "CGST",
    "SGST",
    "IGST",
    "Total Amount",
    "Status",
    "HSN Code",
    "GST Rate %",
  ];

  const rows = invoices.map((inv) =>
    [
      inv.invoice_number ?? "",
      inv.invoice_date ?? "",
      inv.vendor_name ?? "",
      inv.vendor_gstin ?? "",
      inv.buyer_gstin ?? "",
      inv.taxable_amount ?? "",
      inv.cgst ?? "",
      inv.sgst ?? "",
      inv.igst ?? "",
      inv.total_amount ?? "",
      inv.status,
      inv.hsn_code ?? "",
      inv.gst_rate ?? "",
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
  );

  const csv = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\r\n");

  return BOM + csv;
}
