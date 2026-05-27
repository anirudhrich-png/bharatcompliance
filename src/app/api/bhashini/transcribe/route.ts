import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/bhashini";
import type { ApiResponse } from "@/types";

const transcribeSchema = z.object({
  audioBase64: z.string().min(1, "Audio data is required"),
  language: z.enum(["hi", "ta", "te", "mr", "bn", "gu"]),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ transcript: string }>>> {
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
    const parsed = transcribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { audioBase64, language } = parsed.data;

    try {
      const { transcript } = await transcribeAudio(audioBase64, language);
      return NextResponse.json({ success: true, data: { transcript } });
    } catch (err) {
      if (err instanceof Error && err.message === "BHASHINI_NOT_CONFIGURED") {
        return NextResponse.json(
          { success: false, error: "Bhashini is not configured", code: "BHASHINI_NOT_CONFIGURED" },
          { status: 503 }
        );
      }
      throw err;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
