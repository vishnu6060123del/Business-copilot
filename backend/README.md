# AI Procurement Copilot Backend

This directory contains a Next.js App Router compatible backend for the procurement analytics demo.

## Environment

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
PGSSL=true
PG_POOL_MAX=5
```

For local PostgreSQL without SSL, set `PGSSL=false`.

## Database

Apply schema and seed demo data:

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE node backend/scripts/seed.mjs
```

Files:

- `backend/db/schema.sql` - Aurora-compatible relational schema
- `backend/db/seed.sql` - 12 vendors, sample contracts, 12 months of spend history
- `backend/scripts/seed.mjs` - Node seed runner using `pg`

## API Routes

The route files live under `app/api` so they can be copied directly into a Next.js/Vercel project.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/contracts/upload` | POST | Accepts a PDF and returns simulated extracted contract fields |
| `/api/contracts/save` | POST | Saves a contract and links/creates the vendor |
| `/api/dashboard` | GET | Total spend, top suppliers, expiring contracts, category spend |
| `/api/insights` | GET | Contract risk flags and lower-cost vendor recommendations |
| `/api/chat` | POST | Converts simple questions into SQL-backed answers |
| `/api/chat/history` | GET | Demo DynamoDB-like chat history store |
| `/api/suppliers/compare` | POST | Compares 2-3 vendors by spend, average price, and contract count |

## Example Requests

Upload simulation:

```bash
curl -X POST http://localhost:3000/api/contracts/upload \
  -F "file=@./contract.pdf;type=application/pdf"
```

Save contract:

```bash
curl -X POST http://localhost:3000/api/contracts/save \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName":"Acme Office Supplies",
    "value":48000,
    "startDate":"2025-01-01",
    "endDate":"2026-01-01",
    "paymentTerms":"Net 30",
    "category":"Office Supplies"
  }'
```

Chat:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo-user","query":"Who is my most expensive supplier?"}'
```

## Scaling Notes

- Serverless functions use a small cached Postgres pool per warm function instance.
- Dashboard aggregation uses grouped SQL and a refreshable `vendor_spend_summary` materialized view.
- Transactional writes (`contracts/save`) are isolated from read-heavy analytics routes.
- The NoSQL chat store is an in-memory DynamoDB-shaped adapter for the demo. Replace `backend/lib/nosql.ts` with AWS SDK calls for production.