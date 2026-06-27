import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "../../../backend/lib/analytics";

export const runtime = "nodejs";

export async function GET() {
  try {
    const dashboard = await getDashboardAnalytics();
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load dashboard analytics.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}