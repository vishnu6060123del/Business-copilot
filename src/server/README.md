# Serverless API Layer

This demo runs the API layer inside the browser (mock) so the app works end-to-end without a backend. The functions in `api.ts` mirror the REST endpoints that would be deployed as serverless route handlers.

## Suggested Production Mapping (Next.js App Router)

| Endpoint | Method | Handler | Description |
| --- | --- | --- | --- |
| `/api/contracts` | GET | `app/api/contracts/route.ts` | List all contracts |
| `/api/contracts` | POST | `app/api/contracts/route.ts` | Create a contract |
| `/api/contracts/[id]` | GET | `app/api/contracts/[id]/route.ts` | Fetch contract details |
| `/api/contracts/[id]/insights` | GET | `app/api/contracts/[id]/insights/route.ts` | AI-generated insights |
| `/api/contracts/upload` | POST | `app/api/contracts/upload/route.ts` | PDF upload + extraction |
| `/api/vendors` | GET | `app/api/vendors/route.ts` | List vendors |
| `/api/vendors/compare` | POST | `app/api/vendors/compare/route.ts` | Compare selected vendors |
| `/api/spend` | GET | `app/api/spend/route.ts` | Spend records |
| `/api/alerts` | GET | `app/api/alerts/route.ts` | Active AI alerts |
| `/api/chat` | POST | `app/api/chat/route.ts` | Natural-language query |
| `/api/dashboard` | GET | `app/api/dashboard/route.ts` | Dashboard summary |

## Example Next.js Route Handler

```ts
import { NextRequest, NextResponse } from "next/server";
import { getDashboardSummary } from "@/server/api";

export async function GET() {
  const data = await getDashboardSummary();
  return NextResponse.json(data);
}
```

## Database Connection

Production route handlers should use a connection pooler such as `@neondatabase/serverless` or `pg` with AWS RDS Data API for Aurora PostgreSQL. Analytics queries should read from the `vendor_spend_summary` materialized view to keep transactional and analytical workloads separate.
