# Speranza Properties — Rental Payment Tracking

Secure web application for tracking rental payments across the Speranza Properties
portfolio (7 buildings / 26 units, "3 Brothers"). Supports manual entry for checks,
wires, ACH, cash plus automatic deposit sync via Plaid.

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + shadcn/ui-style primitives
- **Supabase** (PostgreSQL + Auth)
- **Prisma** ORM
- **Plaid** (deposit sync)
- **Recharts** for analytics
- **Lucide** icons, **date-fns**, **sonner** toasts

## Folder Structure

```
.
├── prisma/
│   ├── schema.prisma          # Property / Unit / Payment / PlaidItem models
│   └── seed.ts                # Seeds 7 properties + 26 units exactly
├── src/
│   ├── middleware.ts          # Supabase auth gate
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # -> /dashboard
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Sidebar + content
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── properties/page.tsx
│   │   │   ├── properties/[id]/page.tsx
│   │   │   ├── units/[id]/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── payments/new/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── payments/route.ts
│   │       ├── payments/[id]/route.ts
│   │       ├── units/[id]/route.ts
│   │       └── plaid/
│   │           ├── link-token/route.ts
│   │           ├── exchange-token/route.ts
│   │           └── sync/route.ts
│   ├── components/
│   │   ├── providers.tsx
│   │   ├── sidebar.tsx
│   │   ├── top-nav.tsx        # mobile nav
│   │   ├── ui/                # button, card, input, label, table, badge, select, textarea
│   │   ├── dashboard/         # stat-card, property-card
│   │   ├── payments/          # payment-form, payments-table, plaid-link
│   │   ├── units/             # unit-edit-form
│   │   └── reports/           # income-chart
│   └── lib/
│       ├── prisma.ts
│       ├── utils.ts           # cn(), formatMoney(), monthBounds()
│       ├── payments.ts        # unitStatusForMonth(), PAYMENT_METHODS
│       ├── plaid.ts
│       └── supabase/{client,server,middleware}.ts
├── .env.local.example
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in:

**Supabase** (https://supabase.com → New Project):
- `DATABASE_URL` — from Settings → Database → Connection string (URI, pooling on)
- `DIRECT_URL` — same but without pgbouncer (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — from Settings → API (keep secret)

**Plaid** (https://dashboard.plaid.com):
- Sign up and grab Sandbox keys first (`PLAID_ENV=sandbox`)
- `PLAID_CLIENT_ID`, `PLAID_SECRET`
- When ready for real deposits: request Production access, then set `PLAID_ENV=production`

### 3. Database

```bash
npx prisma generate
npx prisma db push        # create tables in Supabase
npm run prisma:seed       # load 7 properties + 26 units
```

### 4. Create the owner user

In the Supabase dashboard → Authentication → Users → "Add user" (email + password).
This is the only account Phase 1 supports.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in with the owner email.

## Features (Phase 1)

- **Dashboard** — total rent potential, collected this month, paid/pending/late
  counts, occupancy, per-property cards.
- **Properties / Units** — drill into each building, view unit status, edit tenant
  name / rent / unit name.
- **Payments** — full filterable ledger (property, method, status, date range);
  add manual payments (check / wire / ACH / cash / other).
- **Plaid** — connect business checking, auto-pull deposits, intelligently match
  by amount + tenant name, record unmatched ones for manual review.
- **Reports** — 12-month income trend chart, per-property summary, rent roll,
  delinquency list.
- **Auth** — Supabase email/password or magic link. Middleware protects all
  non-public routes.

## Phase 2 (not implemented)

- Tenant self-service portal
- Automatic late-fee calculation
- Lease document upload
- Email/SMS payment reminders
- CSV export

## Deployment

Deploy to Vercel:

1. Push the repo to GitHub.
2. Import into Vercel, set all env vars from `.env.local`.
3. Add custom domain `SperanzaProperties.com`.
4. In Supabase Auth settings, add `https://speranzaproperties.com/auth/callback`
   to the allowed redirect URLs.
