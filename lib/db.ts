import { Pool, type ClientBase } from "pg"
import { DsqlSigner } from "@aws-sdk/dsql-signer"
import { attachDatabasePool } from "@vercel/functions"

// Defensive: strip an accidental "NAME=" prefix and surrounding quotes/whitespace
// (e.g. an env var stored as "AWS_REGION=ap-southeast-2" instead of the bare value).
function clean(name: string): string | undefined {
  let v = process.env[name]
  if (!v) return v
  v = v.trim()
  if (v.startsWith(`${name}=`)) v = v.slice(name.length + 1)
  return v.replace(/^['"]|['"]$/g, "").trim()
}

const region = clean("AWS_REGION")
const hostname = clean("PGHOST")
// Normalize the static IAM credentials the AWS SDK reads from the environment.
const accessKeyId = clean("AWS_ACCESS_KEY_ID")
const secretAccessKey = clean("AWS_SECRET_ACCESS_KEY")
if (accessKeyId) process.env.AWS_ACCESS_KEY_ID = accessKeyId
if (secretAccessKey) process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey
if (region) process.env.AWS_REGION = region

const signer = new DsqlSigner({
  region,
  hostname,
  expiresIn: 900,
})

// Reuse a single pool across hot reloads / lambda invocations.
const globalForPool = globalThis as unknown as { __dsqlPool?: Pool }

export const pool =
  globalForPool.__dsqlPool ??
  new Pool({
    host: hostname,
    user: process.env.PGUSER || "admin",
    database: process.env.PGDATABASE || "postgres",
    password: () => signer.getDbConnectAdminAuthToken(),
    port: 5432,
    ssl: true,
    max: 10,
  })

if (!globalForPool.__dsqlPool) {
  globalForPool.__dsqlPool = pool
  attachDatabasePool(pool)
}

export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params)
}

export async function withConnection<T>(fn: (client: ClientBase) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}
