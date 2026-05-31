import { NextRequest, NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/supabase/server";
import { complianceDateSchema } from "@/lib/validations";
import type { ApiResponse, ComplianceDate, FilingType } from "@/types";

interface StandardGSTDate {
  title: string;
  filing_type: FilingType;
  day: number;
  useNextMonth: boolean;
}

const STANDARD_GST_DATES: StandardGSTDate[] = [
  { title: "GSTR-1 Filing", filing_type: "GSTR-1", day: 11, useNextMonth: true },
  { title: "GSTR-3B Filing", filing_type: "GSTR-3B", day: 20, useNextMonth: true },
  { title: "GSTR-2B Available", filing_type: "GSTR-2B", day: 14, useNextMonth: false },
];

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function buildComplianceDates(userId: string): {
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  filing_type: FilingType;
  status: "pending";
}[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

  return STANDARD_GST_DATES.map((d) => {
    const year = d.useNextMonth ? nextMonthYear : currentYear;
    const month = d.useNextMonth ? nextMonth : currentMonth;
    const due_date = `${year}-${padTwo(month)}-${padTwo(d.day)}`;

    const periodLabel = new Date(
      d.useNextMonth ? nextMonthYear : currentYear,
      (d.useNextMonth ? nextMonth : currentMonth) - 1
    ).toLocaleString("en-IN", { month: "long", year: "numeric" });

    return {
      user_id: userId,
      title: d.title,
      description: `${d.title} for ${periodLabel}`,
      due_date,
      filing_type: d.filing_type,
      status: "pending" as const,
    };
  });
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ dates: ComplianceDate[] }>>> {
  try {
    const { user, supabase } = await getSupabaseUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Check for existing records in the current month or later only.
    // Using the all-time count caused two bugs:
    //   (a) old months' dates prevented new months from ever being seeded
    //   (b) concurrent requests could race past the check and double-insert
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-01`;

    const { count, error: countError } = await supabase
      .from("compliance_dates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("due_date", startOfMonth);

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    // Auto-seed standard GST dates when none exist for this month+.
    // Upsert with ignoreDuplicates guards against any remaining race conditions.
    if (count === 0) {
      const defaults = buildComplianceDates(user.id);
      const { error: upsertError } = await supabase
        .from("compliance_dates")
        .upsert(defaults, {
          onConflict: "user_id,filing_type,due_date",
          ignoreDuplicates: true,
        });

      if (upsertError) {
        return NextResponse.json(
          { success: false, error: upsertError.message },
          { status: 500 }
        );
      }
    }

    // Auto-mark overdue: pending dates where due_date < today
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("compliance_dates")
      .update({ status: "overdue" })
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lt("due_date", today);

    // Fetch final list
    const { data: dates, error: finalError } = await supabase
      .from("compliance_dates")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    if (finalError) {
      return NextResponse.json(
        { success: false, error: finalError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { dates: (dates ?? []) as ComplianceDate[] },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ComplianceDate>>> {
  try {
    const { user, supabase } = await getSupabaseUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = complianceDateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Invalid input",
        },
        { status: 400 }
      );
    }

    const { data: date, error } = await supabase
      .from("compliance_dates")
      .insert({
        user_id: user.id,
        ...parsed.data,
        status: "pending",
      })
      .select()
      .single<ComplianceDate>();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: date }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
