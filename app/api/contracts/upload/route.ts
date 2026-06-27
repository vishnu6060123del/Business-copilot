import { NextRequest, NextResponse } from "next/server";
import { simulateContractExtraction } from "../../../../backend/lib/contracts";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required in form field 'file'." }, { status: 400 });
    }

    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF uploads are supported." }, { status: 415 });
    }

    const extracted = await simulateContractExtraction(file);
    return NextResponse.json({ extracted });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process contract upload.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}