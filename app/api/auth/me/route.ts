import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      vendorId: user.vendorId ?? undefined,
      email: user.email ?? undefined,
    },
  })
}
