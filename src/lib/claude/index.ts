import Anthropic from "@anthropic-ai/sdk";
import type { ParsedInvoiceData } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const INVOICE_PARSE_PROMPT = `You are an expert Indian GST accountant and OCR assistant.
Extract the following information from this invoice image/document.
Return ONLY valid JSON, no explanation, no markdown fences.

Required fields:
{
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "vendor_name": string | null,
  "vendor_gstin": string | null,
  "buyer_gstin": string | null,
  "line_items": [{
    "description": string,
    "hsn_code": string | null,
    "quantity": number | null,
    "unit_price": number | null,
    "taxable_amount": number,
    "gst_rate": number,
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
  "language_detected": string,
  "currency": "INR",
  "confidence_score": number
}

Rules:
- GSTIN is always 15 characters: 2 state digits + 10 char PAN + 1 digit + 1 char + 1 check char
- Valid GST rates in India: 0, 5, 12, 18, 28
- If IGST present: CGST and SGST should be 0 (interstate)
- If CGST+SGST present: IGST should be 0 (intrastate)
- Convert all dates to YYYY-MM-DD
- All monetary values must be numbers, not strings
- confidence_score: 0.0 to 1.0 based on legibility and completeness
- If field cannot be determined: null`;

export async function parseInvoiceFromBase64(
  base64Data: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"
): Promise<{ data: ParsedInvoiceData; rawResponse: string }> {
  const isImage = mimeType.startsWith("image/");

  const messageContent: Anthropic.MessageParam["content"] = isImage
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
            data: base64Data,
          },
        },
        { type: "text", text: INVOICE_PARSE_PROMPT },
      ]
    : [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data,
          },
        },
        { type: "text", text: INVOICE_PARSE_PROMPT },
      ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: messageContent }],
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  // Strip any accidental markdown fences
  const cleanJson = rawText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: ParsedInvoiceData;
  try {
    parsed = JSON.parse(cleanJson) as ParsedInvoiceData;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleanJson.slice(0, 200)}`);
  }

  return { data: parsed, rawResponse: rawText };
}

const VOICE_PARSE_PROMPT = `You are an expert Indian GST accountant.
A user has verbally described an invoice in their regional language. Extract structured invoice data from this description.
Return ONLY valid JSON, no explanation, no markdown fences.

The description may be in Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, or a mix of English and regional language.
Extract whatever is mentioned; use null for anything not mentioned.

Required JSON format:
{
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "vendor_name": string | null,
  "vendor_gstin": string | null,
  "buyer_gstin": string | null,
  "line_items": [{
    "description": string,
    "hsn_code": string | null,
    "quantity": number | null,
    "unit_price": number | null,
    "taxable_amount": number,
    "gst_rate": number,
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
  "language_detected": string,
  "currency": "INR",
  "confidence_score": number
}

Rules:
- Valid GST rates in India: 0, 5, 12, 18, 28
- If IGST present: CGST/SGST = 0 (interstate transaction)
- If CGST+SGST present: IGST = 0 (intrastate transaction)
- Convert all dates to YYYY-MM-DD format
- All monetary values must be numbers, not strings
- confidence_score: 0.0–1.0 (lower for vague/incomplete descriptions)
- For missing amounts, derive from available data or use 0
- If a total amount is mentioned but tax breakdown is not, assume 18% GST unless specified`;

export async function parseInvoiceFromText(
  text: string,
  language?: string
): Promise<{ data: ParsedInvoiceData; rawResponse: string }> {
  const langHint = language ? ` The description is primarily in ${language}.` : "";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${VOICE_PARSE_PROMPT}${langHint}\n\nVerbal description:\n"${text}"`,
      },
    ],
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  const cleanJson = rawText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: ParsedInvoiceData;
  try {
    parsed = JSON.parse(cleanJson) as ParsedInvoiceData;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleanJson.slice(0, 200)}`);
  }

  return { data: parsed, rawResponse: rawText };
}

export async function generateComplianceSummary(
  invoiceCount: number,
  mismatches: number,
  upcomingDeadlines: Array<{ title: string; due_date: string }>
): Promise<string> {
  const prompt = `You are a GST compliance assistant for Indian small businesses.
Provide a brief, friendly compliance health summary in 2-3 sentences.
Keep it actionable and in simple language that a non-accountant can understand.

Data:
- Invoices this month: ${invoiceCount}
- Unresolved GSTR-2B mismatches: ${mismatches}
- Upcoming deadlines: ${upcomingDeadlines.map((d) => `${d.title} on ${d.due_date}`).join(", ")}

If there are mismatches, mention the ITC (Input Tax Credit) risk.
If deadlines are soon, mention urgency.
Keep it under 60 words.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");
}
