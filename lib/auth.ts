import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { cookies } from "next/headers"
import { query } from "./db"
import { genId } from "./mappers"

const scrypt = promisify(_scrypt)
const SESSION_COOKIE = "bc_session"
const SESSION_DAYS = 30

export interface SessionUser {
  id: string
  email: string | null
  phone: string | null
  name: string
  role: "vendor" | "client"
  vendorId: string | null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt$${salt}$${derived.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false
  const [, salt, hashHex] = parts
  const derived = (await scrypt(password, salt, 64)) as Buffer
  const stored64 = Buffer.from(hashHex, "hex")
  if (stored64.length !== derived.length) return false
  return timingSafeEqual(stored64, derived)
}

export async function createSession(userId: string): Promise<void> {
  const id = genId("sess")
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await query(`INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`, [id, userId, expires.toISOString()])
  const jar = await cookies()
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires,
  })
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  const id = jar.get(SESSION_COOKIE)?.value
  if (id) {
    await query(`DELETE FROM sessions WHERE id = $1`, [id])
    jar.delete(SESSION_COOKIE)
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const id = jar.get(SESSION_COOKIE)?.value
  if (!id) return null
  const { rows } = await query<Record<string, unknown>>(
    `SELECT u.id, u.email, u.phone, u.name, u.role, u.vendor_id, s.expires_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [id],
  )
  const row = rows[0]
  if (!row) return null
  const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(String(row.expires_at))
  if (expiresAt.getTime() < Date.now()) {
    await query(`DELETE FROM sessions WHERE id = $1`, [id])
    return null
  }
  return {
    id: row.id as string,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    name: row.name as string,
    role: row.role as "vendor" | "client",
    vendorId: (row.vendor_id as string) ?? null,
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("UNAUTHORIZED")
  return user
}
