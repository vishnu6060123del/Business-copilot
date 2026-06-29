// Shared Aurora DSQL connection helper for setup/seed scripts.
// Uses static IAM credentials from the environment (AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY) via the AWS SDK default credential chain.
import pg from "pg"
import { DsqlSigner } from "@aws-sdk/dsql-signer"

const { Pool } = pg

// Defensive: strip an accidental "NAME=" prefix and surrounding quotes/whitespace
// (e.g. an env var saved as "AWS_REGION=ap-southeast-2" instead of "ap-southeast-2").
function clean(name) {
  let v = process.env[name]
  if (!v) return v
  v = v.trim()
  if (v.startsWith(`${name}=`)) v = v.slice(name.length + 1)
  return v.replace(/^['"]|['"]$/g, "").trim()
}

const region = clean("AWS_REGION")
const hostname = clean("PGHOST")
// Normalize the static credentials the AWS SDK reads from the environment.
process.env.AWS_ACCESS_KEY_ID = clean("AWS_ACCESS_KEY_ID")
process.env.AWS_SECRET_ACCESS_KEY = clean("AWS_SECRET_ACCESS_KEY")

if (!region || !hostname) {
  console.error("[scripts] Missing AWS_REGION or PGHOST environment variables.")
  process.exit(1)
}

const signer = new DsqlSigner({
  region,
  hostname,
  expiresIn: 900,
})

export const pool = new Pool({
  host: hostname,
  user: "admin",
  database: "postgres",
  password: () => signer.getDbConnectAdminAuthToken(),
  port: 5432,
  ssl: true,
  max: 5,
})

export async function exec(text, params) {
  return pool.query(text, params)
}
