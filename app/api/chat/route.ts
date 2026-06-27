import { NextRequest, NextResponse } from "next/server";
import { answerProcurementQuestion } from "../../../backend/lib/chat";
import { saveChatHistory } from "../../../backend/lib/nosql";
import { chatQuerySchema } from "../../../backend/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = chatQuerySchema.parse(await request.json());
    const response = await answerProcurementQuestion(payload.query);
    await saveChatHistory({ userId: payload.userId, query: payload.query, response });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to answer chat query.", detail: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}