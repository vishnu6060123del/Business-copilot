import { NextResponse } from "next/server";
import { getContractInsights } from "../../../backend/lib/insights";

export const runtime = "nodejs";

export async function GET() {
  try {
    const insights = await getContractInsights();
    return NextResponse.json({ insights });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate insights.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}