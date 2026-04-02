# 📊 Investor Buddy

**AI-powered stock screening for self-directed investors.**

Investor Buddy lets users define custom screening criteria, evaluate stocks against those criteria, and receive AI-generated plain-language explanations of the results — all in one place.

> Built as a final project for ENTI 674 at the Haskayne School of Business, University of Calgary.

🔗 **Live App:** [investor-buddy--sbeve21.replit.app](https://investor-buddy--sbeve21.replit.app)

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
Evaluate all stocks in the database against your criteria. Each stock receives a pass/fail result per criterion and an aggregate score from 0 to 100. Results are sortable by any column.

**Search & Add Any Stock**
Search Alpha Vantage's database by company name or ticker symbol. Add any U.S.-listed stock with one click — the app fetches and stores all fundamental financial data automatically.

**AI-Powered Analysis**
Click any stock to get a detailed AI-generated explanation of its financial profile and screening score. Powered by Anthropic's Claude API. The AI explains results based entirely on structured data — it does not make predictions or provide investment advice.

**Watchlist**
Save stocks to a personal watchlist to monitor over time. Watchlist data persists across sessions and is tied to the user's account.

**User Authentication**
Register and log in with email and password. All data — criteria sets, watchlist entries, and settings — is scoped to the authenticated user and persists across sessions.

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   React UI  │────▶│  Express API │────▶│    SQLite DB   │
│  (Frontend) │◀────│  (Backend)   │◀────│  (Persistence) │
└─────────────┘     └──────┬───────┘     └────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
     ┌─────────────────┐     ┌───────────────────┐
     │  Alpha Vantage  │     │  Anthropic Claude  │
     │  (Stock Data)   │     │  (AI Analysis)     │
     └─────────────────┘     └───────────────────┘
```

1. Users build screening criteria through the UI
2. The backend evaluates every stock against the criteria using deterministic scoring logic
3. Results are ranked by aggregate score and displayed in a sortable table
4. Users can click any stock to trigger an AI-generated analysis via the Claude API
5. Stock data is fetched from Alpha Vantage and cached in SQLite

---

## Tech Stack

| Layer        | Technology                  | Purpose                                      |
|--------------|-----------------------------|----------------------------------------------|
| Frontend     | React 18, Vite              | Component-based UI with fast hot reloading   |
| Backend      | Node.js, Express.js         | REST API, auth, screening logic              |
| Database     | SQLite (better-sqlite3)     | User accounts, criteria sets, watchlists, stock data |
| Stock Data   | Alpha Vantage API           | Fundamental financial data for any U.S. stock |
| AI           | Anthropic Claude API        | Plain-language analysis of screening results  |
| Auth         | bcryptjs, JSON Web Tokens   | Secure password hashing and session management |
| Hosting      | Replit                      | Development environment and deployment        |

---

## Project Structure

```
investor-buddy/
├── server.js          # Express API — all routes, auth, screening engine, AI proxy
├── seed.js            # Alpha Vantage batch data fetcher (25 stocks/day on free tier)
├── package.json       # Dependencies and scripts
├── vite.config.js     # Vite dev server configuration
├── index.html         # HTML entry point
├── .replit            # Replit run configuration
├── replit.nix         # Replit system dependencies
├── .gitignore         # Excludes node_modules, .db files, .env
├── LICENSE            # MIT License
├── README.md          # This file
└── src/
    ├── main.jsx       # React entry point
    └── App.jsx        # Complete React application (all pages and components)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- An [Alpha Vantage API key](https://www.alphavantage.co/support/#api-key) (free)
- An [Anthropic API key](https://console.anthropic.com/) (for AI analysis)

### Running on Replit

1. Fork or import this repository into a new Repl (Node.js template)
2. Add your API keys in the **Secrets** tab (see [Environment Variables](#environment-variables))
3. Run `npm install` in the Shell
4. Click **Run**

### Running Locally

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/investor-buddy.git
cd investor-buddy

# Install dependencies
npm install

# Set environment variables (create a .env file or export them)
export ALPHA_VANTAGE_KEY=your_key_here
export ANTHROPIC_API_KEY=your_key_here
export JWT_SECRET=any_random_string

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Refreshing Stock Data

The app ships with pre-seeded data for 50 major stocks. To refresh with live data from Alpha Vantage:

```bash
npm run seed
```

Note: The Alpha Vantage free tier allows 25 API calls per day. The seed script fetches data for the 25 oldest-updated stocks each run. Run it over two days to refresh all 50.

You can also refresh individual stocks from the Stocks page in the app by clicking the refresh icon next to any stock.

---

## Environment Variables

| Variable            | Required | Description                              |
|---------------------|----------|------------------------------------------|
| `ALPHA_VANTAGE_KEY` | Yes      | API key for fetching stock data          |
| `ANTHROPIC_API_KEY` | Yes      | API key for AI-generated analysis        |
| `JWT_SECRET`        | Yes      | Secret key for signing auth tokens       |
| `PORT`              | No       | Server port (defaults to 3000)           |

On Replit, add these in the **Secrets** tab (lock icon in the sidebar).

---

## API Documentation

All endpoints except auth require a valid JWT token in the `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint             | Body                        | Description       |
|--------|----------------------|-----------------------------|--------------------|
| POST   | `/api/auth/register` | `{ email, password }`       | Create an account  |
| POST   | `/api/auth/login`    | `{ email, password }`       | Log in             |

### Criteria Sets

| Method | Endpoint             | Description                  |
|--------|----------------------|------------------------------|
| GET    | `/api/criteria`      | List user's saved criteria   |
| POST   | `/api/criteria`      | Create or update a set       |
| DELETE | `/api/criteria/:id`  | Delete a criteria set        |

### Stocks

| Method | Endpoint                      | Description                              |
|--------|-------------------------------|------------------------------------------|
| GET    | `/api/stocks`                 | List all stocks in the database          |
| GET    | `/api/stocks/:ticker`         | Get a single stock's data                |
| GET    | `/api/stocks/search/:query`   | Search Alpha Vantage by name or ticker   |
| POST   | `/api/stocks/add/:ticker`     | Add a new stock from Alpha Vantage       |
| POST   | `/api/stocks/refresh/:ticker` | Refresh a stock's data from Alpha Vantage|
| DELETE | `/api/stocks/:ticker`         | Remove a stock from the database         |

### Screening

| Method | Endpoint       | Body                  | Description                     |
|--------|----------------|-----------------------|---------------------------------|
| POST   | `/api/screen`  | `{ criteria: [...] }` | Run screening against all stocks|

### Watchlist

| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| GET    | `/api/watchlist`          | Get user's watchlist      |
| POST   | `/api/watchlist/:ticker`  | Add stock to watchlist    |
| DELETE | `/api/watchlist/:ticker`  | Remove from watchlist     |

### AI Analysis

| Method | Endpoint        | Body                              | Description                     |
|--------|-----------------|-----------------------------------|---------------------------------|
| POST   | `/api/analyze`  | `{ stock, criteriaDetails }`      | Get AI explanation for a stock  |

---

## AI-Assisted Development

This project was developed using AI-assisted tools as part of the ENTI 674 course requirements:

- **Claude (Anthropic)** — Used for initial ideation, architecture planning, full-stack code generation, component development, API design, and documentation
- **Replit** — Development environment with integrated hosting and deployment
- **Replit AI Agent** — Used for debugging, feature iteration, and refinement during development

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
