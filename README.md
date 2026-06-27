# AI Procurement Copilot – Contract Intelligence Edition

<div align="center">

![AI Procurement Copilot](https://img.shields.io/badge/AI%20Procurement%20Copilot-Contract%20Intelligence-6366f1?style=for-the-badge&logo=lightning&logoColor=white)

**A B2B SaaS platform that helps procurement teams analyze contracts, track supplier spend, and identify savings opportunities using AI.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Aurora-PostgreSQL-336791?style=flat-square&logo=postgresql)](https://aws.amazon.com/rds/aurora/)
[![DynamoDB](https://img.shields.io/badge/DynamoDB-Chat%20History-4053D6?style=flat-square&logo=amazondynamodb)](https://aws.amazon.com/dynamodb/)

[Live Demo](#) · [GitHub Repo](https://github.com/vishnu6060123del/Business-copilot) · [Report Bug](https://github.com/vishnu6060123del/Business-copilot/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [AI Engine](#ai-engine)
- [Pages & UI](#pages--ui)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Scalability Design](#scalability-design)
- [Demo Data](#demo-data)
- [Roadmap](#roadmap)

---

## Overview

**AI Procurement Copilot** is a full-stack procurement intelligence platform built for hackathon demonstration. It gives procurement managers a single pane of glass to:

- **Ingest & analyze** vendor contracts via PDF upload with automatic field extraction
- **Monitor spend** across vendors and categories with real-time dashboards
- **Catch risks early** — expiring contracts, overpayment, and high-cost vendor alerts
- **Compare vendors** side-by-side on price, rating, and spend
- **Ask questions** in plain English via an AI chat interface backed by structured data

The platform supports two authenticated roles:

| Role | Access |
|------|--------|
| **Client** (Procurement Manager) | Dashboard, AI chat, vendor discovery, contract upload, comparison |
| **Vendor** | Profile management, product catalog, subscription, payment history |

---

## Features

### ✅ 1. Contract Upload + Extraction
- Drag-and-drop PDF upload powered by **pdf.js**
- Automatic field extraction:
  - Vendor name · Contract value · Start/end dates · Payment terms · Category
- Extracted data preview before saving
- Store contracts against a structured relational schema

### ✅ 2. AI Insights Engine
Automatically generated after each contract upload:

| Rule | Trigger | Badge |
|------|---------|-------|
| **Expiring Soon** | `end_date ≤ today + 30 days` | 🟡 Yellow |
| **Overpaying** | `contract value > avg vendor spend × 1.1` | 🔴 Red |
| **Vendor Recommendation** | Alternative in same category with lower avg price | 🟢 Green |
| **Optimized** | None of the above apply | ✅ Green |

### ✅ 3. Spend Dashboard (Client)
- **KPI Cards** — Total Spend · Active Contracts · Expiring Soon · Potential Savings
- **Monthly Spend Trend** — interactive line chart (12 months)
- **Spend by Category** — bar chart breakdown
- **Top Suppliers** table with rating stars and spend figures
- **Alerts Panel** — real-time contract expiry and high-cost vendor warnings

### ✅ 4. AI Chat Interface
Natural language questions resolved against live data:

```
"Which contracts expire next month?"
"Who is my most expensive supplier?"
"Show vendors where we are overpaying"
"What are my savings opportunities?"
"Show spend by category"
```

Responses include structured bullet-point answers with highlighted $ figures.  
Chat history is stored in a **DynamoDB-compatible** schema (see [`dynamodb-schema.md`](./dynamodb-schema.md)).

### ✅ 5. Supplier Comparison
- Select 2–3 vendors from a multi-select list
- Side-by-side comparison table:
  - Average Price · Total Spend · Performance Rating · Contract Terms
- Highlights the **best price** and **best rating** cells in green

### ✅ 6. Vendor Portal (Vendor Role)
- Dashboard with subscription status, revenue summary
- Product catalog management
- Client enquiry log
- Payment history with method breakdown
- Subscription plan management with payment gateway modal

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + Vite 7 |
| **Language** | TypeScript 5.9 |
| **Styling** | Tailwind CSS 4.1 |
| **Routing** | React Router 7 |
| **Charts** | Recharts 3 |
| **PDF Parsing** | pdf.js (pdfjs-dist 5) |
| **Icons** | Lucide React |
| **Form Validation** | Zod 4 |
| **Relational DB** | Amazon Aurora (PostgreSQL-compatible) |
| **NoSQL DB** | Amazon DynamoDB (chat history) |
| **Auth** | Role-based context (demo); extendable to AWS Cognito |
| **Hosting** | Vite SPA → S3 + CloudFront / Vercel |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │  Upload  │  │  AI Chat │  │ Compare  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │               │         │
│       └──────────────┴──────────────┴───────────────┘        │
│                             │                                 │
│                      React Router 7                          │
│                      AuthContext (role)                      │
└─────────────────────────────┬────────────────────────────────┘
                              │ REST / in-process queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    lib/db.ts  (Data Layer)                   │
│                                                              │
│  In-memory seed data (demo) ──► production: Aurora PG       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ vendors  │  │contracts │  │  spend   │  │chat hist.│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
   lib/ai.ts (Insights Engine)     DynamoDB Schema
   • Expiry rule                   • ChatSessions
   • Overpaying rule               • ChatMessages
   • Recommendation rule           • UserQueries (audit)
   • Chat query resolver
```

### Scalability Decisions
- **Serverless-first**: stateless API routes map directly to AWS Lambda
- **Analytics separation**: materialized view `vendor_spend_summary` refreshed nightly (see `schema.sql`)
- **Indexed columns**: `end_date`, `vendor_id`, `category`, `date` — critical for large-dataset queries
- **DynamoDB for chat**: single-table design, TTL on old messages, GSI for session lookup
- **CDN delivery**: SPA bundle served from S3 + CloudFront — zero server cold starts on the frontend

---

## Database Schema

### Relational (Amazon Aurora PostgreSQL)

```sql
vendors    (id UUID PK, name, rating, category, description)
users      (id UUID PK, email, name, role, vendor_id FK)
contracts  (id UUID PK, vendor_id FK, value, start_date, end_date,
            payment_terms, category, title, extracted_text)
spend      (id UUID PK, vendor_id FK, amount, date, category)
products   (id UUID PK, vendor_id FK, name, price, unit, category)
requirements (id UUID PK, client_name, title, description, category,
              budget, date, status)
subscriptions (id UUID PK, vendor_id FK, plan, price, renew_date, status)
payments   (id UUID PK, vendor_id FK, amount, date, method)
```

**Materialized view** for analytics:
```sql
vendor_spend_summary  →  total_spend, avg_monthly_spend, transaction_count
```

Full schema: [`schema.sql`](./schema.sql)

### NoSQL (Amazon DynamoDB)

Three-table design (single-table compatible):

| Table | PK | SK | Purpose |
|-------|----|----|---------|
| `ChatSessions` | `USER#<id>` | `SESSION#<id>` | Conversation threads |
| `ChatMessages` | `SESSION#<id>` | `MSG#<ts>#<id>` | Individual messages + SQL snapshots |
| `UserQueries` | `QUERY#<id>` | `USER#<id>` | Audit log + intent classification |

Full schema: [`dynamodb-schema.md`](./dynamodb-schema.md)

---

## AI Engine

Located in [`src/lib/ai.ts`](./src/lib/ai.ts)

### Contract Risk Rules

```typescript
// Rule 1 — Expiring Soon
if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) → flag "Expiring Soon"

// Rule 2 — Overpaying
if (contractValue > avgVendorSpend * 1.1)           → flag "Overpaying"

// Rule 3 — Vendor Recommendation
if (alternativeVendor.avgPrice < currentVendor.avgPrice * 0.9)
                                                    → suggest alternative
```

### Chat Query Resolver

Pattern-matching engine converts natural language → structured data queries:

| Intent Pattern | Query Type | Data Source |
|---------------|-----------|-------------|
| "expir…" / "renew…" | `expiring_contracts` | `contracts` WHERE `end_date ≤ today+30` |
| "expensive" / "top spend" | `top_vendor` | `spend` GROUP BY `vendor_id` |
| "overpay…" / "too much" | `overpaying` | `contracts` JOIN `vendors` WHERE `value > avg_price * 1.1` |
| "categor…" / "by type" | `category_spend` | `spend` GROUP BY `category` |
| "sav…" / "cheaper" | `savings` | cross-category vendor comparison |
| "how many" / "active" | `contract_count` | `contracts` WHERE `status = active` |

---

## Pages & UI

### Client Role

| Route | Page | Description |
|-------|------|-------------|
| `/client/dashboard` | **Dashboard** | KPIs, charts, top suppliers, expiring contracts, alerts |
| `/client/vendors` | **Vendors** | Browse all vendors with category filter |
| `/client/vendors/:id` | **Vendor Detail** | Full profile, products, contracts, insights |
| `/client/chat` | **AI Chat** | Natural language query interface |
| `/client/compare` | **Supplier Comparison** | Multi-vendor comparison table |
| `/client/requirement` | **Post Requirement** | Submit procurement requirements |
| `/upload` | **Upload Contract** | PDF upload + extraction + AI insights |

### Vendor Role

| Route | Page | Description |
|-------|------|-------------|
| `/vendor/dashboard` | **Vendor Dashboard** | Subscription status, revenue summary |
| `/vendor/profile` | **Profile** | Company info management |
| `/vendor/products` | **Products** | Product catalog CRUD |
| `/vendor/clients` | **Client Log** | Incoming client enquiries |
| `/vendor/payments` | **Payments** | Payment history and methods |
| `/vendor/subscription` | **Subscription** | Plan management + payment gateway |
| `/vendor/history` | **History** | Activity log |

### UI Components

```
components/
├── Layout.tsx           ← Sidebar + Header shell
├── MobileNav.tsx        ← Responsive mobile navigation
├── PaymentGatewayModal  ← Stripe-style payment modal
└── ui.tsx               ← Design system: Button, Badge, Card, Input, Table, ...
```

**Badge system:**

| Badge | Color | Meaning |
|-------|-------|---------|
| Expiring Soon | 🟡 Amber | `end_date ≤ 30 days` |
| High Cost | 🔴 Red | Spend > category avg ×1.15 |
| Optimized | 🟢 Emerald | Within expected range |
| Active | 🔵 Indigo | Contract in force |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/vishnu6060123del/Business-copilot.git
cd Business-copilot/ai_intelligence

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs at **http://localhost:5173**

### Demo Login Credentials

The app ships with two demo accounts (no backend required — auth is context-based for demo):

| Role | How to Login |
|------|-------------|
| **Client** (Procurement Manager) | Select "Client" on the login screen |
| **Vendor** | Select "Vendor" on the login screen |

### Build for Production

```bash
npm run build      # Outputs to dist/
npm run preview    # Preview the production bundle locally
```

The build is a **single-file SPA** (via `vite-plugin-singlefile`) — deploy `dist/index.html` anywhere (S3, Vercel, Netlify, GitHub Pages).

---

## Project Structure

```
ai_intelligence/
├── src/
│   ├── App.tsx                  # Route definitions (client + vendor)
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Tailwind base styles
│   │
│   ├── components/
│   │   ├── Layout.tsx           # Sidebar + header shell
│   │   ├── MobileNav.tsx        # Mobile-responsive nav
│   │   ├── PaymentGatewayModal.tsx  # Payment UI
│   │   └── ui.tsx               # Reusable design-system components
│   │
│   ├── context/
│   │   └── AuthContext.tsx      # Role-based auth provider
│   │
│   ├── lib/
│   │   ├── db.ts                # In-memory data store (Aurora-compatible schema)
│   │   ├── ai.ts                # AI insights engine + chat resolver
│   │   ├── pdfExtract.ts        # PDF parsing with pdf.js
│   │   ├── format.ts            # Currency / date formatters
│   │   └── types.ts             # All TypeScript interfaces
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx        # Client spend dashboard
│   │   ├── Chat.tsx             # AI chat interface
│   │   ├── Compare.tsx          # Vendor comparison
│   │   ├── Upload.tsx           # Contract upload + extraction
│   │   ├── ContractDetail.tsx   # Contract + AI insights
│   │   ├── Login.tsx            # Role selection login
│   │   ├── client/
│   │   │   ├── Vendors.tsx      # Vendor browse page
│   │   │   ├── VendorDetail.tsx # Vendor profile + products
│   │   │   └── Requirement.tsx  # Post procurement requirement
│   │   └── vendor/
│   │       ├── Dashboard.tsx    # Vendor home
│   │       ├── Profile.tsx      # Company profile
│   │       ├── Products.tsx     # Product catalog
│   │       ├── ClientLog.tsx    # Client enquiries
│   │       ├── Payments.tsx     # Payment history
│   │       ├── Subscription.tsx # Plan management
│   │       └── History.tsx      # Activity log
│   │
│   └── utils/                   # Shared utility functions
│
├── schema.sql                   # Aurora PostgreSQL DDL + indexes + materialized view
├── dynamodb-schema.md           # DynamoDB table design for chat history
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## API Reference

The demo uses in-process data queries from `lib/db.ts`. In production, replace with REST or GraphQL endpoints backed by Aurora.

### Contracts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/contracts` | List all contracts with vendor info |
| `GET` | `/api/contracts/:id` | Get single contract + AI insights |
| `POST` | `/api/contracts` | Create contract (from upload extraction) |
| `GET` | `/api/contracts/expiring` | Contracts expiring within 30 days |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vendors` | List all vendors |
| `GET` | `/api/vendors/:id` | Vendor detail + products + spend |
| `GET` | `/api/vendors/compare?ids=1,2,3` | Multi-vendor comparison data |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | KPIs, monthly spend, category spend, alerts |

### AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | `{ message: string }` → structured answer |
| `GET` | `/api/chat/history` | Retrieve session history |

### Spend

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/spend/monthly` | Monthly spend totals (12 months) |
| `GET` | `/api/spend/by-category` | Spend grouped by category |
| `GET` | `/api/spend/top-vendors` | Top vendors by total spend |

---

## Scalability Design

This application is architected to scale from hackathon demo to enterprise production:

### Database
- **Aurora PostgreSQL** for transactional reads/writes — multi-AZ, auto-scaling storage
- **Materialized view** (`vendor_spend_summary`) separates analytics from OLTP — refresh nightly or on-demand
- **Indexes** on all foreign keys and filter columns (`end_date`, `category`, `date`)
- **Read replicas** for dashboard and analytics queries

### Backend
- **Serverless API routes** → AWS Lambda + API Gateway (no servers to manage)
- **Connection pooling** via RDS Proxy for Lambda → Aurora connections
- **DynamoDB** for chat (infinite scale, single-digit ms latency)

### Frontend
- **SPA + CDN**: Vite bundle → S3 + CloudFront (global edge delivery)
- **Code splitting**: route-level lazy loading for fast initial paint
- **Recharts**: client-side rendering — no server load for chart computation

### AI Layer
- **Rule-based engine** (zero latency, deterministic) for contract risk scoring
- **Pluggable LLM**: replace chat resolver with OpenAI / Bedrock API call — same interface
- **DynamoDB UserQueries table** captures all queries for model fine-tuning

---

## Demo Data

The in-memory data store (`lib/db.ts`) seeds:

**12 Vendors** across 5 categories:

| Category | Vendors |
|----------|---------|
| IT Infrastructure | CloudNova Systems, DataSphere Analytics, Apex Security |
| Legal | LexPro Legal Services, LegalEdge Partners |
| Logistics | SwiftLogix, GlobalShip Co, RocketFreight |
| Marketing | BrandForge Agency, CreativeMinds Studio |
| Facilities | FacilityPro, BuildRight Facilities |

**15 Contracts** with varied statuses:
- 3 expiring within 30 days (triggers alerts)
- 3 expired (historical)
- 9 active with different payment terms

**24 months** of spend history per vendor with realistic variance

---

## Roadmap

- [ ] AWS Cognito authentication
- [ ] Real Aurora PostgreSQL connection (swap `lib/db.ts`)
- [ ] OpenAI / AWS Bedrock integration for true LLM chat
- [ ] Email notifications for expiring contracts
- [ ] Contract e-signature workflow
- [ ] Multi-tenant support with organization isolation
- [ ] Export to Excel / PDF reports
- [ ] Webhook integrations (Slack, Teams alerts)
- [ ] Mobile app (React Native)

---

## Contributing

1. Fork the repo — [github.com/vishnu6060123del/Business-copilot](https://github.com/vishnu6060123del/Business-copilot)
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push and open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for hackathon · **AI Procurement Copilot – Contract Intelligence Edition**

[⭐ Star on GitHub](https://github.com/vishnu6060123del/Business-copilot)

</div>
