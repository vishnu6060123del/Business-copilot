// Shared Aurora DSQL connection helper for setup/seed scripts.
// Uses static IAM credentials from the environment (AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY) via the AWS SDK default credential chain.
import pg from "pg"
import { DsqlSigner } from "@aws-sdk/dsql-signer"

const { Pool } = pg

const region = process.env.AWS_REGION
const hostname = process.env.PGHOST

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
