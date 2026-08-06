# Round Treasury

Treasury dashboard that aggregates bank accounts, transactions, and financial stats for business founders and executives. Built with Plaid (Open Banking) and Temporal (workflow engine).

## Architecture

```
apps/
  frontend/    → Next.js 16 (App Router) — dashboard UI
  backend/     → NestJS — REST API + Plaid integration
libs/
  ui/          → Shared component library (Tailwind + shadcn/ui)
```

**Key technologies:** Nx monorepo, PostgreSQL, Prisma, Temporal, Plaid SDK, Recharts

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (local)
- Temporal CLI (`brew install temporal`)
- Plaid developer account (free sandbox)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. PostgreSQL

Create a database:

```bash
createdb round_treasury
```

### 3. Environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` with your values:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/round_treasury?schema=public"
PLAID_CLIENT_ID=<your plaid client id>
PLAID_SECRET=<your plaid sandbox secret>
TEMPORAL_ADDRESS=localhost:7233
```

Get Plaid credentials from https://dashboard.plaid.com/developers/keys

### 4. Database migration

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Start Temporal

```bash
temporal server start-dev
```

### 6. Start the Temporal worker (separate terminal)

```bash
npx ts-node apps/backend/src/temporal/worker.ts
```

### 7. Start the backend

```bash
pnpm nx run backend:serve
```

Backend runs on http://localhost:3000

### 8. Start the frontend

```bash
pnpm nx run frontend:dev
```

Frontend runs on http://localhost:4200

## Usage

1. Open http://localhost:4200 — you'll see the Accounts dashboard
2. Click "+ Link bank account"
3. In the Plaid sandbox dialog, use credentials: `user_good` / `pass_good`
4. Select any bank and accounts
5. After linking, the Temporal workflow triggers and syncs accounts + transactions
6. Dashboard populates with balances, stats, and transaction history

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/integrations/plaid/create-link-token` | Create Plaid Link token |
| POST | `/api/integrations/plaid/exchange-public-token` | Exchange public token, trigger sync |
| GET | `/api/user/accounts` | List all linked accounts |
| GET | `/api/user/transactions?account_id=&from=&to=` | List transactions (with filters) |
| GET | `/api/user/reports` | Get computed financial reports |

## Temporal Workflow

**`syncBankDataWorkflow`** runs three activities in sequence:

1. `syncUserAccounts` — fetches account balances from Plaid, upserts to DB
2. `syncUserTransactions` — uses `/transactions/sync` (cursor-based) for incremental sync
3. `generateUserReports` — computes runway, monthly spend, monthly income

**Triggers:**
- Immediately after a bank account is linked
- On a 1-hour Temporal schedule

## Assumptions & Shortcuts

- **No authentication** — single hardcoded demo user (as per spec)
- **Currency hardcoded to GBP** — matches the mockup; a real implementation would handle multi-currency
- **Runway formula** — `total_balance / avg_monthly_net_burn` (simple division, no linear regression)
- **No pagination** on transaction list — limited to 100 most recent
- **No WebSocket/SSE** for real-time updates after sync completes — requires page refresh
- **Plaid sandbox data is static** — the same test data appears regardless of sync frequency

## What would be different in production

- **Authentication & multi-tenancy** — JWT/session-based auth, user-scoped data isolation
- **Plaid webhooks** — listen for `TRANSACTIONS_SYNC_AVAILABLE` instead of polling on a timer
- **Proper error handling** — retry logic in activities, dead letter queues, alerting
- **Multi-currency support** — exchange rates, per-account currency display
- **Pagination & infinite scroll** on transactions
- **Real-time updates** — WebSocket push after workflow completes
- **Encrypted secrets** — Plaid access tokens encrypted at rest
- **Audit logging** — track all sync operations and data changes
- **Rate limiting** — respect Plaid's per-item limits (30/hour for balance)
- **Idempotent workflow execution** — handle Temporal retries gracefully
- **Database indexes** — on `user_id`, `account_id`, `date` for query performance
- **Monitoring** — Temporal workflow dashboards, error rates, sync latency metrics

## Security Considerations

- Plaid `access_token` stored in plaintext — should be encrypted (AES-256) in production
- No CSRF protection on POST endpoints
- No rate limiting on API — vulnerable to abuse
- Demo user ID is predictable — no authorization checks
- `.env` contains secrets — must never be committed (it's in `.gitignore`)
