import { NextRequest, NextResponse } from "next/server";
import { saveContract } from "../../../../backend/lib/contracts";
import { saveContractSchema } from "../../../../backend/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = saveContractSchema.parse(await request.json());
    const saved = await saveContract(payload);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("Vendor not found") ? 404 : 400;
    return NextResponse.json({ error: "Failed to save contract.", detail: message }, { status });
  }
}