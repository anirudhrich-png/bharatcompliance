import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { gstr2bUploadSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

interface GSTRItmDet {
  txval?: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  [key: string]: unknown;
}

interface GSTRItm {
  itm_det?: GSTRItmDet;
  [key: string]: unknown;
}

interface GSTRInv {
  inum?: string;
  dt?: string;
  val?: number;
  itms?: GSTRItm[];
  [key: string]: unknown;
}

interface GSTRB2BEntry {
  ctin?: string;
  inv?: GSTRInv[];
  [key: string]: unknown;
}

// "MMYYYY" → "YYYY-MM"  e.g. "012023" → "2023-01"
function fpToPeriod(fp: string): string | null {
  const match = /^(\d{2})(\d{4})$/.exec(fp.trim());
  if (!match) return null;
  return `${match[2]}-${match[1]}`;
}

// "DD-MM-YYYY" → "YYYY-MM-DD"
function convertDate(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split("-");
  if (parts.length !== 3) return ddmmyyyy;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
}

// Safely unwrap a field that may itself be a JSON string
function unwrapJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function extractB2BEntries(parsed: unknown): { entries: GSTRB2BEntry[]; fp: string | null } {
  if (typeof parsed !== "object" || parsed === null) {
    console.log("[gstr/upload] Parsed value is not an object:", typeof parsed);
    return { entries: [], fp: null };
  }

  const obj = parsed as Record<string, unknown>;
  console.log("[gstr/upload] Top-level keys:", Object.keys(obj));

  // Extract fp for period auto-detection
  const fp = typeof obj["fp"] === "string" ? obj["fp"] : null;
  console.log("[gstr/upload] fp field:", fp);

  // Path: obj.data.docdata.b2b
  // obj.data may itself be a JSON string on some portal exports
  const rawData = obj["data"];
  console.log("[gstr/upload] data field type:", typeof rawData);

  const dataObj = unwrapJson(rawData);
  console.log(
    "[gstr/upload] data (unwrapped) type:",
    typeof dataObj,
    dataObj && typeof dataObj === "object" ? "keys: " + Object.keys(dataObj as object).join(", ") : ""
  );

  if (typeof dataObj === "object" && dataObj !== null) {
    const dataMap = dataObj as Record<string, unknown>;
    const rawDocdata = dataMap["docdata"];
    console.log("[gstr/upload] docdata type:", typeof rawDocdata);

    const docdataObj = unwrapJson(rawDocdata);
    console.log(
      "[gstr/upload] docdata (unwrapped) type:",
      typeof docdataObj,
      docdataObj && typeof docdataObj === "object" ? "keys: " + Object.keys(docdataObj as object).join(", ") : ""
    );

    if (typeof docdataObj === "object" && docdataObj !== null) {
      const docMap = docdataObj as Record<string, unknown>;
      const b2b = docMap["b2b"];
      console.log("[gstr/upload] b2b type:", typeof b2b, "isArray:", Array.isArray(b2b));

      if (Array.isArray(b2b) && b2b.length > 0) {
        console.log("[gstr/upload] First b2b entry keys:", Object.keys(b2b[0] as object));
        return { entries: b2b as GSTRB2BEntry[], fp };
      }
    }
  }

  // Fallback: obj.b2b directly
  const directB2b = obj["b2b"];
  console.log("[gstr/upload] Fallback direct b2b type:", typeof directB2b, "isArray:", Array.isArray(directB2b));
  if (Array.isArray(directB2b) && directB2b.length > 0) {
    console.log("[gstr/upload] First direct b2b entry keys:", Object.keys(directB2b[0] as object));
    return { entries: directB2b as GSTRB2BEntry[], fp };
  }

  return { entries: [], fp };
}

// Read a field case-insensitively from an object
function getField<T>(obj: Record<string, unknown>, ...names: string[]): T | undefined {
  for (const name of names) {
    const lower = name.toLowerCase();
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === lower) return obj[key] as T;
    }
  }
  return undefined;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ period: string; entriesCount: number; totalITC: number }>>> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = gstr2bUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { jsonData } = parsed.data;

    let gstrParsed: unknown;
    try {
      gstrParsed = JSON.parse(jsonData);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON data" },
        { status: 400 }
      );
    }

    const { entries: b2bEntries, fp } = extractB2BEntries(gstrParsed);

    // Resolve period: explicit in request > extracted from fp > error
    let period = parsed.data.period;
    if (!period && fp) {
      const extracted = fpToPeriod(fp);
      console.log("[gstr/upload] Extracted period from fp:", extracted);
      if (extracted) period = extracted;
    }

    if (!period) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not determine period. Pass period (YYYY-MM) in the request or ensure the JSON contains an 'fp' field (e.g. '012023').",
        },
        { status: 400 }
      );
    }

    if (b2bEntries.length === 0) {
      return NextResponse.json(
        { success: false, error: "No B2B entries found in GSTR-2B JSON. Expected path: data.docdata.b2b" },
        { status: 400 }
      );
    }

    console.log("[gstr/upload] Processing", b2bEntries.length, "B2B supplier entries for period", period);

    const rows: {
      user_id: string;
      period: string;
      supplier_gstin: string;
      invoice_number: string;
      invoice_date: string;
      taxable_amount: number;
      igst: number;
      cgst: number;
      sgst: number;
      raw_data: Record<string, unknown>;
      match_status: string;
    }[] = [];

    for (const entry of b2bEntries) {
      const entryObj = entry as Record<string, unknown>;
      // Support both lowercase and uppercase field names (CTIN / ctin)
      const ctin = getField<string>(entryObj, "ctin");
      const invs = getField<GSTRInv[]>(entryObj, "inv", "invs", "invoices");

      if (!ctin) {
        console.log("[gstr/upload] Skipping entry — no ctin. Keys:", Object.keys(entryObj));
        continue;
      }
      if (!Array.isArray(invs)) {
        console.log("[gstr/upload] Skipping entry ctin:", ctin, "— inv is not an array. Keys:", Object.keys(entryObj));
        continue;
      }

      for (const inv of invs) {
        const invObj = inv as Record<string, unknown>;
        const inum = getField<string>(invObj, "inum", "num", "inv_no", "invoice_no");
        const dt = getField<string>(invObj, "idt", "dt", "date", "invoice_date");

        if (!inum || !dt) {
          console.log("[gstr/upload] Skipping invoice — missing inum/dt. Keys:", Object.keys(invObj));
          continue;
        }

        const itms = getField<GSTRItm[]>(invObj, "itms", "items") ?? [];
        let totalTxval = 0;
        let totalIgst = 0;
        let totalCgst = 0;
        let totalSgst = 0;

        for (const itm of itms) {
          const itmObj = itm as Record<string, unknown>;
          const det = (getField<GSTRItmDet>(itmObj, "itm_det", "item_details") ?? {}) as Record<string, unknown>;
          // GST portal uses iamt/camt/samt; older exports may use igst/cgst/sgst
          const numOr0 = (v: unknown) => (typeof v === "number" ? v : 0);
          totalTxval += numOr0(det["txval"]);
          totalIgst  += numOr0(det["iamt"]) || numOr0(det["igst"]);
          totalCgst  += numOr0(det["camt"]) || numOr0(det["cgst"]);
          totalSgst  += numOr0(det["samt"]) || numOr0(det["sgst"]);
        }

        rows.push({
          user_id: user.id,
          period,
          supplier_gstin: ctin,
          invoice_number: inum,
          invoice_date: convertDate(dt),
          taxable_amount: totalTxval,
          igst: totalIgst,
          cgst: totalCgst,
          sgst: totalSgst,
          raw_data: invObj,
          match_status: "unmatched",
        });
      }
    }

    console.log("[gstr/upload] Rows to upsert:", rows.length);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Found B2B supplier entries but could not extract invoice rows. " +
            "Check server logs — ctin or inv fields may be missing or named differently.",
        },
        { status: 400 }
      );
    }

    const { error: upsertError } = await supabase
      .from("gstr2b_entries")
      .upsert(rows, {
        onConflict: "user_id,period,supplier_gstin,invoice_number",
      });

    if (upsertError) {
      console.error("[gstr/upload] Upsert error:", upsertError);
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500 }
      );
    }

    const totalITC = rows.reduce((sum, r) => sum + r.igst + r.cgst + r.sgst, 0);
    console.log("[gstr/upload] Done. Entries:", rows.length, "Total ITC:", totalITC);

    return NextResponse.json(
      { success: true, data: { period, entriesCount: rows.length, totalITC } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[gstr/upload] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
