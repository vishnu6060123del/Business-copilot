import { NextRequest, NextResponse } from "next/server";
import { getChatHistory } from "../../../../backend/lib/nosql";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "demo-user";
  const history = await getChatHistory(userId);
  return NextResponse.json({ history });
}