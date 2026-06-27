import { NextRequest, NextResponse } from "next/server";
import { compareSuppliers } from "../../../../backend/lib/analytics";
import { supplierCompareSchema } from "../../../../backend/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = supplierCompareSchema.parse(await request.json());
    const comparison = await compareSuppliers(payload.vendorIds);
    return NextResponse.json({ comparison });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to compare suppliers.", detail: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}