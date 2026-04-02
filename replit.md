# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is **Investor Buddy** — an AI-powered stock screening application.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Anthropic Claude (via Replit AI Integrations)
- **Auth**: JWT (bcryptjs + jsonwebtoken)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── investor-buddy/     # React + Vite frontend (served at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/seed-stocks.ts  # Seeds 49 stocks into the database
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application Features

- **User Authentication** — Register and login with email/password (bcrypt + JWT)
- **Criteria Builder** — Create criteria sets using 10 financial metrics (P/E, EPS growth, ROE, etc.)
- **Screening Engine** — Score 49 stocks (0–100) against user-defined criteria
- **Results Page** — Ranked list with per-criterion pass/fail indicators
- **AI Analysis** — Claude-powered plain-language stock explanations
- **Watchlist** — Save and track stocks across sessions
- **Dashboard** — Summary stats, sector breakdown, top performers
- **Stock Browser** — Filterable table of all 49 stocks

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/stocks` | Get all 49 stocks |
| GET | `/api/stocks/:ticker` | Get stock details |
| GET | `/api/criteria` | List user's criteria sets |
| POST | `/api/criteria` | Create/update criteria set |
| PUT | `/api/criteria/:id` | Update criteria set |
| DELETE | `/api/criteria/:id` | Delete criteria set |
| POST | `/api/screen` | Screen stocks with criteria |
| GET | `/api/watchlist` | Get user's watchlist |
| POST | `/api/watchlist/:ticker` | Add to watchlist |
| DELETE | `/api/watchlist/:ticker` | Remove from watchlist |
| POST | `/api/analyze` | Get AI analysis for a stock |
| GET | `/api/dashboard/summary` | Dashboard summary stats |
| GET | `/api/dashboard/sector-breakdown` | Stocks by sector |
| GET | `/api/dashboard/top-performers` | Top 10 by EPS growth |

## DB Schema

- `users` — id, email, password_hash, created_at
- `stocks` — ticker (PK), name, sector, price, pe_ratio, debt_to_equity, eps_growth, dividend_yield, roe, revenue_growth, profit_margin, current_ratio, market_cap_b, beta, updated_at
- `criteria_sets` — id (text PK), user_id, name, criteria_json, created_at, updated_at
- `watchlist` — id, user_id, ticker, added_at (unique on user_id+ticker)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — Used as JWT signing secret
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Anthropic API proxy URL (auto-provisioned)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Anthropic API key (auto-provisioned)

## Key Commands

- `pnpm --filter @workspace/db run push` — Push DB schema changes
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client hooks
- `pnpm --filter @workspace/scripts run seed-stocks` — Seed stock data
- `pnpm run typecheck` — Full typecheck across all packages
