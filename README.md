# 📊 Investor Buddy

**AI-powered stock screening for self-directed investors.**

Investor Buddy lets users define custom screening criteria, evaluate 500 S&P 500 stocks against those criteria, and receive AI-generated plain-language explanations of the results — all in one place.

> Built as a final project for ENTI 674 at the Haskayne School of Business, University of Calgary.

🔗 **Live App:** [investor-buddy-1--sbeve21.replit.app](https://investor-buddy-1--sbeve21.replit.app/)
🐙 **GitHub:** [github.com/steveroyan21dsouza-bot/Investor-Buddy-1](https://github.com/steveroyan21dsouza-bot/Investor-Buddy-1)

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [AI-Assisted Development](#ai-assisted-development)
- [Team](#team)
- [License](#license)

---

## Features

**Criteria Builder**
Define screening criteria by selecting from 10 financial metrics (P/E Ratio, Debt-to-Equity, EPS Growth, Dividend Yield, ROE, Revenue Growth, Profit Margin, Current Ratio, Market Cap, Beta). Set thresholds using greater-than, less-than, or between operators. Save and reuse named criteria sets.

**Quick-Start Templates**
Five pre-built screening strategies — Value Investing, Growth Stocks, Dividend Income, Low Volatility, and Quality at Any Price — that can be used as-is or customized.

**Screening Engine**
Evaluate all 500 stocks against your criteria. Each stock receives a pass/fail result per criterion and an aggregate score from 0 to 100. Results are sortable by any column.

**Live Prices**
Real-time price quotes and ▲/▼ change indicators powered by Finnhub. Prices are cached for 60 seconds and refresh automatically. A "Refresh Prices" button triggers a batch update across all 500 stocks.

**AI-Powered Analysis**
Click any stock to get a detailed AI-generated explanation of its financial profile and screening score. Powered by Anthropic's Claude Sonnet. The AI explains results based entirely on structured data — it does not make predictions or provide investment advice.

**Watchlist**
Save stocks to a personal watchlist with live price tracking. Watchlist data persists across sessions and is tied to the user's account.

**User Authentication**
Register and log in with email and password. All data — criteria sets, watchlist entries — is scoped to the authenticated user.

---

## How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (React 18)                    │
│                                                              │
│  Login / Register  ──►  Criteria Builder  ──►  Screen Run   │
│         │                     │                    │         │
│         ▼                     ▼                    ▼         │
│    Watchlist             Dashboard             AI Analysis   │
└───────────────────────────────┬──────────────────────────────┘
                                │  HTTPS (REST API)
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    Express API Server (Node.js)              │
│                                                              │
│  /auth    ─ JWT-based registration & login                   │
│  /stocks  ─ list, quote, batch-quote, refresh-all            │
│  /screen  ─ deterministic scoring engine (0–100)             │
│  /analyze ─ proxies structured stock data to Claude          │
│  /watchlist, /criteria, /dashboard                           │
└───────┬──────────────────────┬──────────────────────────────-┘
        │                      │
        ▼                      ▼
┌───────────────┐    ┌──────────────────────────────────────┐
│  PostgreSQL   │    │         External APIs                 │
│  (Drizzle ORM)│    │                                      │
│               │    │  Finnhub  ── live quotes & metrics   │
│  users        │    │  Anthropic Claude Sonnet             │
│  stocks       │    │            ── AI stock analysis      │
│  criteria     │    └──────────────────────────────────────┘
│  watchlist    │
└───────────────┘
```

**Request flow, step by step:**

1. The user builds a criteria set in the React UI (e.g., P/E < 20 AND EPS Growth > 10%)
2. On "Run Screen", the frontend sends the criteria to `POST /screen`
3. The API evaluates every stock in the PostgreSQL database against each criterion
4. Each stock is assigned a pass/fail per criterion and an aggregate score (0–100)
5. Results return to the UI, sorted by score, with live prices fetched from Finnhub
6. The user clicks a stock → `POST /analyze` sends the stock's structured data to Claude
7. Claude returns a four-section plain-language explanation (profile, strengths, risks, verdict)
8. On every server start, the seed function syncs the database to exactly 500 S&P 500 stocks

---

## Tech Stack

| Layer        | Technology                      | Purpose                                                  |
|--------------|---------------------------------|----------------------------------------------------------|
| Frontend     | React 18, Vite, TypeScript      | Component-based UI, fast hot reloading                   |
| Routing      | Wouter                          | Lightweight client-side routing                          |
| Data Fetching| TanStack Query (React Query)    | Server state, caching, auto-refetch for live prices      |
| UI Components| shadcn/ui, Tailwind CSS         | Accessible, composable component library                 |
| Backend      | Node.js, Express 5, TypeScript  | REST API, auth middleware, screening logic               |
| Database     | PostgreSQL (Replit-managed)     | Users, stocks, criteria sets, watchlist entries          |
| ORM          | Drizzle ORM                     | Type-safe schema, queries, and migrations                |
| API Contract | OpenAPI 3.1 + Orval             | Auto-generated typed API client from `openapi.yaml`      |
| Stock Data   | Finnhub API                     | Live quotes, real-time price & change indicators         |
| AI           | Anthropic Claude Sonnet         | Plain-language analysis of screening results             |
| Auth         | JWT + bcrypt                    | Secure password hashing, stateless session management    |
| Monorepo     | pnpm workspaces                 | Shared packages across frontend, backend, and libs       |
| Hosting      | Replit                          | Development environment, managed PostgreSQL, deployment   |

---

## Project Structure

```
investor-buddy/                        ← monorepo root
├── package.json                       ← workspace root scripts
├── pnpm-workspace.yaml                ← declares workspace packages
├── pnpm-lock.yaml
├── tsconfig.json                      ← base TypeScript config
├── tsconfig.base.json
├── README.md
├── replit.md                          ← Replit-specific architecture notes
│
├── artifacts/
│   │
│   ├── investor-buddy/                ← React 18 frontend (Vite)
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   ├── components.json            ← shadcn/ui config
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   └── opengraph.jpg
│   │   └── src/
│   │       ├── main.tsx               ← React entry point
│   │       ├── App.tsx                ← router + query client setup
│   │       ├── index.css              ← Tailwind base styles
│   │       ├── components/
│   │       │   ├── Layout.tsx         ← nav, sidebar, shell
│   │       │   └── LivePrice.tsx      ← real-time price cell + hook
│   │       ├── pages/
│   │       │   ├── login.tsx          ← register / sign-in
│   │       │   ├── dashboard.tsx      ← summary stats
│   │       │   ├── stocks.tsx         ← browse + refresh prices
│   │       │   ├── criteria.tsx       ← criteria list & templates
│   │       │   ├── criteria-form.tsx  ← build / edit a criteria set
│   │       │   ├── screen.tsx         ← run screen, results table
│   │       │   ├── watchlist.tsx      ← personal watchlist
│   │       │   └── not-found.tsx
│   │       ├── hooks/
│   │       │   ├── use-mobile.tsx
│   │       │   └── use-toast.ts
│   │       └── lib/
│   │           ├── auth.ts            ← JWT storage helpers
│   │           └── utils.ts
│   │
│   └── api-server/                    ← Express 5 backend (Node.js)
│       ├── package.json
│       ├── tsconfig.json
│       ├── build.mjs                  ← esbuild bundle script
│       └── src/
│           ├── index.ts               ← server entry, port binding, seed call
│           ├── app.ts                 ← Express app, middleware, route mounts
│           ├── seed.ts                ← 500-stock universe, startup sync
│           ├── lib/
│           │   └── logger.ts          ← pino structured logger
│           ├── middlewares/
│           │   └── auth.ts            ← JWT verification middleware
│           └── routes/
│               ├── index.ts           ← route aggregator
│               ├── auth.ts            ← POST /auth/register, /auth/login
│               ├── stocks.ts          ← GET/POST /stocks, live Finnhub quotes
│               ├── screen.ts          ← POST /screen — scoring engine
│               ├── analyze.ts         ← POST /analyze — Claude Sonnet proxy
│               ├── criteria.ts        ← CRUD /criteria
│               ├── watchlist.ts       ← CRUD /watchlist
│               ├── dashboard.ts       ← GET /dashboard
│               └── health.ts          ← GET /health
│
└── lib/                               ← shared workspace packages
    ├── api-spec/
    │   ├── openapi.yaml               ← single source of truth for the API contract
    │   └── orval.config.ts            ← codegen config (run: pnpm codegen)
    ├── api-client-react/              ← auto-generated React Query hooks
    │   └── src/
    │       ├── index.ts
    │       ├── custom-fetch.ts        ← auth header injection
    │       └── generated/
    │           ├── api.ts             ← typed query/mutation hooks
    │           └── api.schemas.ts     ← TypeScript interfaces
    ├── api-zod/                       ← auto-generated Zod validators
    │   └── src/
    │       ├── index.ts
    │       └── generated/
    │           ├── api.ts
    │           └── types/             ← one file per schema type
    └── db/                            ← Drizzle ORM schema + client
        └── src/
            ├── index.ts               ← exports db client
            └── schema/
                ├── index.ts
                ├── users.ts           ← users table
                ├── stocks.ts          ← stocks table (500 rows)
                ├── criteria.ts        ← criteria_sets table
                └── watchlist.ts       ← watchlist_items table
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- [pnpm](https://pnpm.io/) 8 or higher (`npm install -g pnpm`)
- A [Finnhub API key](https://finnhub.io/) (free tier available)
- An [Anthropic API key](https://console.anthropic.com/) (for AI analysis)
- A PostgreSQL database (Replit provides one automatically)

### Running on Replit

1. Fork or import this repository into a new Repl
2. Add your API keys in the **Secrets** tab (see [Environment Variables](#environment-variables))
3. Replit will provision a PostgreSQL database automatically
4. Click **Run** — the server seeds the 500-stock universe on first start

### Running Locally

```bash
# Clone the repository
git clone https://github.com/steveroyan21dsouza-bot/Investor-Buddy-1.git
cd Investor-Buddy-1

# Install all workspace dependencies
pnpm install

# Set environment variables
export FINNHUB_API_KEY=your_finnhub_key
export ANTHROPIC_API_KEY=your_anthropic_key
export DATABASE_URL=postgres://user:password@localhost:5432/investorbuddy
export JWT_SECRET=any_long_random_string

# Generate typed API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Start both servers (frontend + backend)
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/investor-buddy run dev  # UI on :25001
```

---

## Environment Variables

| Variable            | Required | Description                                             |
|---------------------|----------|---------------------------------------------------------|
| `FINNHUB_API_KEY`   | Yes      | Finnhub API key for live stock quotes and fundamentals  |
| `ANTHROPIC_API_KEY` | Yes      | Anthropic key for Claude Sonnet AI analysis             |
| `DATABASE_URL`      | Yes      | PostgreSQL connection string (auto-set on Replit)       |
| `JWT_SECRET`        | Yes      | Secret for signing auth tokens (any long random string) |
| `PORT`              | No       | API server port (defaults to 8080)                      |

On Replit, add these in the **Secrets** tab (lock icon in the sidebar). `DATABASE_URL` is set automatically when a Replit database is provisioned.

---

## API Documentation

All endpoints except `/auth/*` and `/health` require a valid JWT token in the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint              | Body                    | Description      |
|--------|-----------------------|-------------------------|------------------|
| POST   | `/auth/register`      | `{ email, password }`   | Create account   |
| POST   | `/auth/login`         | `{ email, password }`   | Sign in          |

### Stocks

| Method | Endpoint                   | Description                                          |
|--------|----------------------------|------------------------------------------------------|
| GET    | `/stocks`                  | List all 500 stocks                                  |
| GET    | `/stocks/:ticker`          | Get a single stock's fundamentals                    |
| GET    | `/stocks/quote/:ticker`    | Get live price quote (60s cache)                     |
| POST   | `/stocks/quotes`           | Batch live quotes `{ tickers: string[] }`            |
| POST   | `/stocks/refresh-all`      | Trigger async price refresh for all stocks (202)     |
| POST   | `/stocks/add/:ticker`      | Add a stock by ticker via Finnhub                    |

### Screening

| Method | Endpoint    | Body                  | Description                          |
|--------|-------------|-----------------------|--------------------------------------|
| POST   | `/screen`   | `{ criteria: [...] }` | Score all 500 stocks, returns ranked |

### Criteria Sets

| Method | Endpoint          | Description                    |
|--------|-------------------|--------------------------------|
| GET    | `/criteria`       | List user's saved criteria sets|
| POST   | `/criteria`       | Create or update a criteria set|
| DELETE | `/criteria/:id`   | Delete a criteria set          |

### Watchlist

| Method | Endpoint               | Description                  |
|--------|------------------------|------------------------------|
| GET    | `/watchlist`           | Get user's watchlist         |
| POST   | `/watchlist/:ticker`   | Add stock to watchlist       |
| DELETE | `/watchlist/:ticker`   | Remove from watchlist        |

### AI Analysis

| Method | Endpoint    | Body                         | Description                        |
|--------|-------------|------------------------------|------------------------------------|
| POST   | `/analyze`  | `{ stock, criteriaDetails }` | Get Claude Sonnet analysis         |

### Dashboard & Health

| Method | Endpoint      | Description                          |
|--------|---------------|--------------------------------------|
| GET    | `/dashboard`  | Summary stats (stock count, sectors) |
| GET    | `/health`     | Server health check                  |

---

## AI-Assisted Development

This project was developed using AI-assisted tools as part of the ENTI 674 course requirements:

- **Claude (Anthropic)** — Used for initial ideation, architecture planning, full-stack code generation, component development, API design, and documentation
- **Replit** — Development environment with integrated hosting, managed PostgreSQL, and one-click deployment
- **Replit AI Agent** — Used for debugging, feature iteration, stock universe expansion (404→500 stocks), live price integration, and refinement during development

The AI tools were used to accelerate development while the team provided product direction, business requirements, testing, and quality oversight.

---

## Team

| Name | Role |
|------|------|
| <!-- Add team member names and roles here --> | |

*ENTI 674 — Haskayne School of Business, University of Calgary*

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

*Disclaimer: Investor Buddy is an informational tool only and does not constitute registered investment advice. Users are solely responsible for their own investment decisions.*
