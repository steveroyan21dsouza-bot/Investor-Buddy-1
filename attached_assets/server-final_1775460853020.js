import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || "";
const FINNHUB_KEY = process.env.FINNHUB_KEY || "";

app.use(cors());
app.use(express.json());

// ─── DATABASE ───────────────────────────────────────────────────────
const db = new Database(join(__dirname, "investor_buddy.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS criteria_sets (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    criteria_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticker TEXT NOT NULL,
    added_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, ticker)
  );
  CREATE TABLE IF NOT EXISTS stocks (
    ticker TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT NOT NULL DEFAULT 'Unknown',
    price REAL DEFAULT 0,
    pe_ratio REAL DEFAULT 0,
    debt_to_equity REAL DEFAULT 0,
    eps_growth REAL DEFAULT 0,
    dividend_yield REAL DEFAULT 0,
    roe REAL DEFAULT 0,
    revenue_growth REAL DEFAULT 0,
    profit_margin REAL DEFAULT 0,
    current_ratio REAL DEFAULT 0,
    market_cap_b REAL DEFAULT 0,
    beta REAL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── SEED DEFAULTS ──────────────────────────────────────────────────
function seedDefaults() {
  const count = db.prepare("SELECT COUNT(*) as c FROM stocks").get().c;
  if (count > 0) return;

  const stocks = [
    { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", price: 227.48, pe_ratio: 37.5, debt_to_equity: 1.87, eps_growth: 10.2, dividend_yield: 0.44, roe: 157.4, revenue_growth: 5.0, profit_margin: 26.3, current_ratio: 0.87, market_cap_b: 3440, beta: 1.24 },
    { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology", price: 415.20, pe_ratio: 35.8, debt_to_equity: 0.29, eps_growth: 21.5, dividend_yield: 0.72, roe: 35.6, revenue_growth: 16.0, profit_margin: 35.6, current_ratio: 1.27, market_cap_b: 3090, beta: 0.90 },
    { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", price: 174.50, pe_ratio: 23.1, debt_to_equity: 0.05, eps_growth: 36.8, dividend_yield: 0.46, roe: 32.0, revenue_growth: 14.0, profit_margin: 29.5, current_ratio: 2.10, market_cap_b: 2140, beta: 1.06 },
    { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", price: 198.30, pe_ratio: 42.5, debt_to_equity: 0.54, eps_growth: 95.0, dividend_yield: 0.0, roe: 23.8, revenue_growth: 12.5, profit_margin: 8.0, current_ratio: 1.06, market_cap_b: 2070, beta: 1.15 },
    { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology", price: 134.50, pe_ratio: 64.2, debt_to_equity: 0.17, eps_growth: 168.0, dividend_yield: 0.03, roe: 115.8, revenue_growth: 122.0, profit_margin: 55.8, current_ratio: 4.17, market_cap_b: 3290, beta: 1.67 },
    { ticker: "META", name: "Meta Platforms", sector: "Technology", price: 585.00, pe_ratio: 27.3, debt_to_equity: 0.22, eps_growth: 59.0, dividend_yield: 0.36, roe: 35.4, revenue_growth: 22.0, profit_margin: 35.0, current_ratio: 2.73, market_cap_b: 1480, beta: 1.22 },
    { ticker: "TSLA", name: "Tesla Inc.", sector: "Consumer", price: 248.40, pe_ratio: 94.5, debt_to_equity: 0.11, eps_growth: -23.0, dividend_yield: 0.0, roe: 20.5, revenue_growth: 2.0, profit_margin: 13.0, current_ratio: 1.84, market_cap_b: 795, beta: 2.31 },
    { ticker: "JPM", name: "JPMorgan Chase", sector: "Finance", price: 242.80, pe_ratio: 12.4, debt_to_equity: 1.52, eps_growth: 18.0, dividend_yield: 2.08, roe: 17.2, revenue_growth: 11.0, profit_margin: 33.0, current_ratio: 0.85, market_cap_b: 690, beta: 1.07 },
    { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", price: 154.60, pe_ratio: 22.8, debt_to_equity: 0.49, eps_growth: 6.5, dividend_yield: 3.18, roe: 21.5, revenue_growth: 4.3, profit_margin: 17.5, current_ratio: 1.11, market_cap_b: 373, beta: 0.53 },
    { ticker: "V", name: "Visa Inc.", sector: "Finance", price: 310.20, pe_ratio: 31.5, debt_to_equity: 0.52, eps_growth: 14.0, dividend_yield: 0.73, roe: 49.0, revenue_growth: 10.0, profit_margin: 55.2, current_ratio: 1.45, market_cap_b: 595, beta: 0.94 },
    { ticker: "PG", name: "Procter & Gamble", sector: "Consumer", price: 165.90, pe_ratio: 27.0, debt_to_equity: 0.73, eps_growth: 2.0, dividend_yield: 2.38, roe: 31.5, revenue_growth: 2.0, profit_margin: 18.5, current_ratio: 0.65, market_cap_b: 392, beta: 0.43 },
    { ticker: "UNH", name: "UnitedHealth Group", sector: "Healthcare", price: 520.00, pe_ratio: 20.5, debt_to_equity: 0.70, eps_growth: 11.0, dividend_yield: 1.52, roe: 25.8, revenue_growth: 8.5, profit_margin: 6.2, current_ratio: 0.79, market_cap_b: 475, beta: 0.68 },
    { ticker: "HD", name: "Home Depot", sector: "Consumer", price: 380.50, pe_ratio: 25.2, debt_to_equity: 42.5, eps_growth: 3.0, dividend_yield: 2.35, roe: 1250.0, revenue_growth: 3.0, profit_margin: 10.3, current_ratio: 1.35, market_cap_b: 378, beta: 1.04 },
    { ticker: "MA", name: "Mastercard Inc.", sector: "Finance", price: 520.00, pe_ratio: 36.8, debt_to_equity: 2.12, eps_growth: 16.0, dividend_yield: 0.52, roe: 177.0, revenue_growth: 12.0, profit_margin: 46.5, current_ratio: 1.20, market_cap_b: 480, beta: 1.08 },
    { ticker: "DIS", name: "Walt Disney Co.", sector: "Consumer", price: 108.50, pe_ratio: 38.5, debt_to_equity: 0.46, eps_growth: 25.0, dividend_yield: 0.92, roe: 5.3, revenue_growth: 3.7, profit_margin: 7.5, current_ratio: 0.97, market_cap_b: 198, beta: 1.35 },
    { ticker: "ADBE", name: "Adobe Inc.", sector: "Technology", price: 475.00, pe_ratio: 44.2, debt_to_equity: 0.33, eps_growth: 12.5, dividend_yield: 0.0, roe: 34.0, revenue_growth: 11.0, profit_margin: 26.5, current_ratio: 1.11, market_cap_b: 206, beta: 1.28 },
    { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology", price: 275.00, pe_ratio: 46.5, debt_to_equity: 0.15, eps_growth: 48.0, dividend_yield: 0.56, roe: 10.2, revenue_growth: 11.0, profit_margin: 17.0, current_ratio: 1.09, market_cap_b: 264, beta: 1.22 },
    { ticker: "PFE", name: "Pfizer Inc.", sector: "Healthcare", price: 26.50, pe_ratio: 48.0, debt_to_equity: 0.73, eps_growth: -60.0, dividend_yield: 5.90, roe: 3.2, revenue_growth: -42.0, profit_margin: 4.5, current_ratio: 1.17, market_cap_b: 149, beta: 0.65 },
    { ticker: "NFLX", name: "Netflix Inc.", sector: "Technology", price: 780.00, pe_ratio: 42.5, debt_to_equity: 0.63, eps_growth: 65.0, dividend_yield: 0.0, roe: 30.5, revenue_growth: 15.0, profit_margin: 22.0, current_ratio: 1.15, market_cap_b: 335, beta: 1.45 },
    { ticker: "INTC", name: "Intel Corp.", sector: "Technology", price: 21.40, pe_ratio: -8.5, debt_to_equity: 0.47, eps_growth: -85.0, dividend_yield: 1.40, roe: -3.2, revenue_growth: -1.5, profit_margin: -3.0, current_ratio: 1.57, market_cap_b: 91, beta: 0.99 },
    { ticker: "KO", name: "Coca-Cola Co.", sector: "Consumer", price: 62.80, pe_ratio: 25.5, debt_to_equity: 1.73, eps_growth: 7.0, dividend_yield: 3.08, roe: 40.5, revenue_growth: 3.0, profit_margin: 23.0, current_ratio: 1.13, market_cap_b: 271, beta: 0.58 },
    { ticker: "PEP", name: "PepsiCo Inc.", sector: "Consumer", price: 160.40, pe_ratio: 23.0, debt_to_equity: 2.35, eps_growth: -1.0, dividend_yield: 3.42, roe: 50.8, revenue_growth: -0.5, profit_margin: 11.0, current_ratio: 0.85, market_cap_b: 220, beta: 0.54 },
    { ticker: "MRK", name: "Merck & Co.", sector: "Healthcare", price: 125.50, pe_ratio: 22.5, debt_to_equity: 0.85, eps_growth: -2.0, dividend_yield: 2.48, roe: 30.0, revenue_growth: 1.0, profit_margin: 24.0, current_ratio: 1.35, market_cap_b: 318, beta: 0.40 },
    { ticker: "XOM", name: "Exxon Mobil", sector: "Energy", price: 108.60, pe_ratio: 13.5, debt_to_equity: 0.16, eps_growth: -15.0, dividend_yield: 3.48, roe: 16.0, revenue_growth: -5.0, profit_margin: 10.0, current_ratio: 1.42, market_cap_b: 460, beta: 0.82 },
    { ticker: "CVX", name: "Chevron Corp.", sector: "Energy", price: 150.20, pe_ratio: 13.8, debt_to_equity: 0.14, eps_growth: -18.0, dividend_yield: 4.20, roe: 12.0, revenue_growth: -8.0, profit_margin: 10.5, current_ratio: 1.25, market_cap_b: 275, beta: 0.95 },
    { ticker: "WMT", name: "Walmart Inc.", sector: "Consumer", price: 85.50, pe_ratio: 34.0, debt_to_equity: 0.56, eps_growth: 6.0, dividend_yield: 1.04, roe: 21.0, revenue_growth: 5.5, profit_margin: 2.5, current_ratio: 0.82, market_cap_b: 688, beta: 0.52 },
    { ticker: "ABT", name: "Abbott Labs", sector: "Healthcare", price: 118.40, pe_ratio: 28.5, debt_to_equity: 0.37, eps_growth: 3.5, dividend_yield: 1.82, roe: 16.0, revenue_growth: 1.5, profit_margin: 14.5, current_ratio: 1.65, market_cap_b: 205, beta: 0.72 },
    { ticker: "BAC", name: "Bank of America", sector: "Finance", price: 43.20, pe_ratio: 14.5, debt_to_equity: 1.10, eps_growth: 12.0, dividend_yield: 2.28, roe: 10.5, revenue_growth: 5.0, profit_margin: 28.0, current_ratio: 0.78, market_cap_b: 340, beta: 1.35 },
    { ticker: "GS", name: "Goldman Sachs", sector: "Finance", price: 530.00, pe_ratio: 16.0, debt_to_equity: 2.45, eps_growth: 75.0, dividend_yield: 2.10, roe: 12.5, revenue_growth: 12.0, profit_margin: 24.0, current_ratio: 0.90, market_cap_b: 175, beta: 1.38 },
    { ticker: "NEE", name: "NextEra Energy", sector: "Utilities", price: 78.50, pe_ratio: 29.5, debt_to_equity: 1.25, eps_growth: 8.0, dividend_yield: 2.62, roe: 12.5, revenue_growth: 15.0, profit_margin: 22.0, current_ratio: 0.48, market_cap_b: 161, beta: 0.68 },
    { ticker: "LIN", name: "Linde plc", sector: "Materials", price: 455.00, pe_ratio: 32.0, debt_to_equity: 0.28, eps_growth: 8.5, dividend_yield: 1.22, roe: 17.0, revenue_growth: 2.0, profit_margin: 19.5, current_ratio: 0.86, market_cap_b: 219, beta: 0.88 },
    { ticker: "CAT", name: "Caterpillar Inc.", sector: "Industrial", price: 370.00, pe_ratio: 17.0, debt_to_equity: 1.80, eps_growth: 8.0, dividend_yield: 1.55, roe: 58.0, revenue_growth: 3.0, profit_margin: 16.0, current_ratio: 1.42, market_cap_b: 178, beta: 1.08 },
    { ticker: "DE", name: "Deere & Co.", sector: "Industrial", price: 420.00, pe_ratio: 14.5, debt_to_equity: 2.10, eps_growth: -18.0, dividend_yield: 1.38, roe: 35.0, revenue_growth: -12.0, profit_margin: 16.5, current_ratio: 2.10, market_cap_b: 118, beta: 1.02 },
    { ticker: "UNP", name: "Union Pacific", sector: "Industrial", price: 238.00, pe_ratio: 22.0, debt_to_equity: 1.95, eps_growth: 5.0, dividend_yield: 2.22, roe: 42.0, revenue_growth: 1.0, profit_margin: 27.0, current_ratio: 0.72, market_cap_b: 145, beta: 1.00 },
    { ticker: "T", name: "AT&T Inc.", sector: "Telecom", price: 22.80, pe_ratio: 12.0, debt_to_equity: 1.15, eps_growth: -8.0, dividend_yield: 4.85, roe: 9.5, revenue_growth: 1.0, profit_margin: 12.0, current_ratio: 0.58, market_cap_b: 163, beta: 0.72 },
    { ticker: "VZ", name: "Verizon Comms.", sector: "Telecom", price: 42.50, pe_ratio: 9.5, debt_to_equity: 1.62, eps_growth: 2.0, dividend_yield: 6.25, roe: 17.5, revenue_growth: 1.5, profit_margin: 11.0, current_ratio: 0.73, market_cap_b: 179, beta: 0.40 },
    { ticker: "AMT", name: "American Tower", sector: "Real Estate", price: 202.50, pe_ratio: 42.0, debt_to_equity: 5.40, eps_growth: -20.0, dividend_yield: 3.30, roe: 22.0, revenue_growth: 4.0, profit_margin: 15.0, current_ratio: 0.75, market_cap_b: 94, beta: 0.78 },
    { ticker: "SPG", name: "Simon Property", sector: "Real Estate", price: 160.00, pe_ratio: 20.5, debt_to_equity: 8.50, eps_growth: 5.0, dividend_yield: 5.15, roe: 73.0, revenue_growth: 3.0, profit_margin: 28.0, current_ratio: 1.10, market_cap_b: 59, beta: 1.52 },
    { ticker: "SHW", name: "Sherwin-Williams", sector: "Materials", price: 345.00, pe_ratio: 33.5, debt_to_equity: 7.20, eps_growth: 9.0, dividend_yield: 0.82, roe: 75.0, revenue_growth: 2.5, profit_margin: 13.0, current_ratio: 0.85, market_cap_b: 87, beta: 1.10 },
    { ticker: "MMM", name: "3M Company", sector: "Industrial", price: 105.00, pe_ratio: 12.8, debt_to_equity: 1.75, eps_growth: 38.0, dividend_yield: 2.10, roe: 45.0, revenue_growth: -5.0, profit_margin: 14.5, current_ratio: 1.45, market_cap_b: 58, beta: 0.95 },
    { ticker: "COST", name: "Costco Wholesale", sector: "Consumer", price: 880.00, pe_ratio: 50.5, debt_to_equity: 0.32, eps_growth: 13.0, dividend_yield: 0.52, roe: 30.0, revenue_growth: 7.5, profit_margin: 2.8, current_ratio: 1.02, market_cap_b: 390, beta: 0.80 },
    { ticker: "ABBV", name: "AbbVie Inc.", sector: "Healthcare", price: 180.50, pe_ratio: 55.0, debt_to_equity: 5.80, eps_growth: -35.0, dividend_yield: 3.48, roe: 62.0, revenue_growth: -6.0, profit_margin: 12.5, current_ratio: 0.87, market_cap_b: 319, beta: 0.57 },
    { ticker: "LLY", name: "Eli Lilly & Co.", sector: "Healthcare", price: 800.00, pe_ratio: 108.0, debt_to_equity: 2.10, eps_growth: 59.0, dividend_yield: 0.62, roe: 58.0, revenue_growth: 20.0, profit_margin: 18.0, current_ratio: 1.22, market_cap_b: 760, beta: 0.42 },
    { ticker: "ORCL", name: "Oracle Corp.", sector: "Technology", price: 175.00, pe_ratio: 38.0, debt_to_equity: 7.50, eps_growth: 15.0, dividend_yield: 0.92, roe: 120.0, revenue_growth: 6.0, profit_margin: 22.0, current_ratio: 0.72, market_cap_b: 485, beta: 1.02 },
    { ticker: "AMD", name: "AMD Inc.", sector: "Technology", price: 155.00, pe_ratio: 110.0, debt_to_equity: 0.04, eps_growth: 42.0, dividend_yield: 0.0, roe: 4.5, revenue_growth: 10.0, profit_margin: 7.5, current_ratio: 2.50, market_cap_b: 250, beta: 1.72 },
    { ticker: "QCOM", name: "Qualcomm Inc.", sector: "Technology", price: 170.00, pe_ratio: 18.5, debt_to_equity: 0.58, eps_growth: 28.0, dividend_yield: 1.88, roe: 42.0, revenue_growth: 9.0, profit_margin: 26.5, current_ratio: 2.35, market_cap_b: 190, beta: 1.32 },
    { ticker: "GE", name: "GE Aerospace", sector: "Industrial", price: 182.00, pe_ratio: 36.0, debt_to_equity: 0.85, eps_growth: 56.0, dividend_yield: 0.62, roe: 28.0, revenue_growth: 16.0, profit_margin: 14.5, current_ratio: 1.08, market_cap_b: 198, beta: 1.18 },
    { ticker: "SO", name: "Southern Company", sector: "Utilities", price: 82.00, pe_ratio: 22.5, debt_to_equity: 1.58, eps_growth: 5.5, dividend_yield: 3.55, roe: 13.0, revenue_growth: 4.0, profit_margin: 14.0, current_ratio: 0.68, market_cap_b: 89, beta: 0.48 },
    { ticker: "DUK", name: "Duke Energy", sector: "Utilities", price: 105.00, pe_ratio: 19.8, debt_to_equity: 1.42, eps_growth: 6.0, dividend_yield: 3.82, roe: 9.5, revenue_growth: 5.0, profit_margin: 13.0, current_ratio: 0.55, market_cap_b: 81, beta: 0.42 },
    { ticker: "COP", name: "ConocoPhillips", sector: "Energy", price: 108.50, pe_ratio: 12.0, debt_to_equity: 0.38, eps_growth: -22.0, dividend_yield: 1.85, roe: 18.0, revenue_growth: -8.0, profit_margin: 16.5, current_ratio: 1.30, market_cap_b: 132, beta: 1.10 },
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO stocks (ticker, name, sector, price, pe_ratio, debt_to_equity, eps_growth,
      dividend_yield, roe, revenue_growth, profit_margin, current_ratio, market_cap_b, beta)
    VALUES (@ticker, @name, @sector, @price, @pe_ratio, @debt_to_equity, @eps_growth,
      @dividend_yield, @roe, @revenue_growth, @profit_margin, @current_ratio, @market_cap_b, @beta)
  `);
  const tx = db.transaction(() => { for (const s of stocks) insert.run(s); });
  tx();
  console.log(`Seeded ${stocks.length} stocks.`);
}
seedDefaults();

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
  try {
    req.userId = jwt.verify(h.split(" ")[1], JWT_SECRET).userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── AUTH ROUTES ────────────────────────────────────────────────────
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;
  if (!email?.includes("@")) return res.status(400).json({ error: "Please enter a valid email address." });
  if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email))
    return res.status(409).json({ error: "An account with this email already exists." });
  const result = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, bcrypt.hashSync(password, 10));
  res.json({ token: jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: "30d" }), email });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: "Invalid email or password." });
  res.json({ token: jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" }), email: user.email });
});

// ─── CRITERIA ROUTES ────────────────────────────────────────────────
app.get("/api/criteria", auth, (req, res) => {
  res.json(db.prepare("SELECT * FROM criteria_sets WHERE user_id = ? ORDER BY updated_at DESC")
    .all(req.userId).map(r => ({ ...r, criteria: JSON.parse(r.criteria_json) })));
});

app.post("/api/criteria", auth, (req, res) => {
  const { id, name, criteria } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name is required." });
  if (!criteria?.length) return res.status(400).json({ error: "At least one criterion is required." });
  const cid = id || `cs-${Date.now()}`;
  db.prepare(`INSERT INTO criteria_sets (id, user_id, name, criteria_json) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, criteria_json=excluded.criteria_json, updated_at=datetime('now')`)
    .run(cid, req.userId, name.trim(), JSON.stringify(criteria));
  res.json({ id: cid, name: name.trim(), criteria });
});

app.delete("/api/criteria/:id", auth, (req, res) => {
  db.prepare("DELETE FROM criteria_sets WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
  res.json({ success: true });
});

// ─── STOCK ROUTES ───────────────────────────────────────────────────
app.get("/api/stocks", auth, (req, res) => {
  res.json(db.prepare("SELECT * FROM stocks ORDER BY ticker").all());
});

app.get("/api/stocks/:ticker", auth, (req, res) => {
  const stock = db.prepare("SELECT * FROM stocks WHERE ticker = ?").get(req.params.ticker.toUpperCase());
  if (!stock) return res.status(404).json({ error: "Stock not found." });
  res.json(stock);
});

// Search Alpha Vantage for tickers
app.get("/api/stocks/search/:query", auth, async (req, res) => {
  if (!ALPHA_VANTAGE_KEY) return res.status(400).json({ error: "Alpha Vantage API key not configured." });
  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(req.params.query)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.Note || data.Information) return res.status(429).json({ error: "API rate limit reached. Try again in a minute." });
    const matches = (data.bestMatches || [])
      .filter(m => m["4. region"] === "United States" || m["4. region"] === "United States/Canada")
      .slice(0, 8)
      .map(m => ({
        ticker: m["1. symbol"],
        name: m["2. name"],
        type: m["3. type"],
        region: m["4. region"],
        inDatabase: !!db.prepare("SELECT ticker FROM stocks WHERE ticker = ?").get(m["1. symbol"]),
      }));
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Search failed. Please try again." });
  }
});

// Add a stock by fetching from Alpha Vantage
app.post("/api/stocks/add/:ticker", auth, async (req, res) => {
  if (!ALPHA_VANTAGE_KEY) return res.status(400).json({ error: "Alpha Vantage API key not configured." });
  const ticker = req.params.ticker.toUpperCase();
  
  // Check if already exists
  const existing = db.prepare("SELECT * FROM stocks WHERE ticker = ?").get(ticker);
  if (existing) return res.json(existing);

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json();
    
    if (data.Note || data.Information) return res.status(429).json({ error: "API rate limit reached. Try again later." });
    if (!data.Symbol) return res.status(404).json({ error: `No data found for ${ticker}.` });

    const stock = {
      ticker: data.Symbol,
      name: data.Name || ticker,
      sector: data.Sector || "Unknown",
      price: parseFloat(data["50DayMovingAverage"]) || parseFloat(data["200DayMovingAverage"]) || 0,
      pe_ratio: parseFloat(data.PERatio) || 0,
      debt_to_equity: parseFloat(data.DebtToEquityRatio) || 0,
      eps_growth: (parseFloat(data.QuarterlyEarningsGrowthYOY) || 0) * 100,
      dividend_yield: (parseFloat(data.DividendYield) || 0) * 100,
      roe: (parseFloat(data.ReturnOnEquityTTM) || 0) * 100,
      revenue_growth: (parseFloat(data.QuarterlyRevenueGrowthYOY) || 0) * 100,
      profit_margin: (parseFloat(data.ProfitMargin) || 0) * 100,
      current_ratio: parseFloat(data.CurrentRatio) || 0,
      market_cap_b: Math.round((parseFloat(data.MarketCapitalization) || 0) / 1e9),
      beta: parseFloat(data.Beta) || 0,
    };

    db.prepare(`INSERT INTO stocks (ticker, name, sector, price, pe_ratio, debt_to_equity, eps_growth,
      dividend_yield, roe, revenue_growth, profit_margin, current_ratio, market_cap_b, beta)
      VALUES (@ticker, @name, @sector, @price, @pe_ratio, @debt_to_equity, @eps_growth,
      @dividend_yield, @roe, @revenue_growth, @profit_margin, @current_ratio, @market_cap_b, @beta)`).run(stock);

    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data." });
  }
});

// Refresh existing stock
app.post("/api/stocks/refresh/:ticker", auth, async (req, res) => {
  if (!ALPHA_VANTAGE_KEY) return res.status(400).json({ error: "Alpha Vantage API key not configured." });
  const ticker = req.params.ticker.toUpperCase();
  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.Note || data.Information) return res.status(429).json({ error: "Rate limit reached." });
    if (!data.Symbol) return res.status(404).json({ error: `No data for ${ticker}.` });

    db.prepare(`UPDATE stocks SET
      name=?, sector=?, price=?, pe_ratio=?, debt_to_equity=?, eps_growth=?,
      dividend_yield=?, roe=?, revenue_growth=?, profit_margin=?,
      current_ratio=?, market_cap_b=?, beta=?, updated_at=datetime('now')
      WHERE ticker=?`).run(
      data.Name || ticker,
      data.Sector || "Unknown",
      parseFloat(data["50DayMovingAverage"]) || 0,
      parseFloat(data.PERatio) || 0,
      parseFloat(data.DebtToEquityRatio) || 0,
      (parseFloat(data.QuarterlyEarningsGrowthYOY) || 0) * 100,
      (parseFloat(data.DividendYield) || 0) * 100,
      (parseFloat(data.ReturnOnEquityTTM) || 0) * 100,
      (parseFloat(data.QuarterlyRevenueGrowthYOY) || 0) * 100,
      (parseFloat(data.ProfitMargin) || 0) * 100,
      parseFloat(data.CurrentRatio) || 0,
      Math.round((parseFloat(data.MarketCapitalization) || 0) / 1e9),
      parseFloat(data.Beta) || 0,
      ticker
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to refresh." });
  }
});

// Delete stock
app.delete("/api/stocks/:ticker", auth, (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  db.prepare("DELETE FROM watchlist WHERE ticker = ?").run(ticker);
  db.prepare("DELETE FROM stocks WHERE ticker = ?").run(ticker);
  res.json({ success: true });
});

// ─── LIVE QUOTES (FINNHUB) ──────────────────────────────────────────
const quoteCache = new Map(); // ticker -> { data, timestamp }
const CACHE_TTL = 60_000; // 60 seconds

async function fetchQuote(ticker) {
  const cached = quoteCache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

  if (!FINNHUB_KEY) return null;
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.c && data.c > 0) {
      const quote = {
        price: data.c,        // current price
        change: data.d,       // change
        changePercent: data.dp, // change percent
        high: data.h,         // day high
        low: data.l,          // day low
        open: data.o,         // open
        prevClose: data.pc,   // previous close
        timestamp: Date.now(),
      };
      quoteCache.set(ticker, { data: quote, timestamp: Date.now() });
      return quote;
    }
  } catch {}
  return null;
}

// Single quote
app.get("/api/quote/:ticker", auth, async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const quote = await fetchQuote(ticker);
  if (!quote) return res.json({ available: false, ticker });
  res.json({ available: true, ticker, ...quote });
});

// Batch quotes — accepts { tickers: ["AAPL", "MSFT", ...] }
app.post("/api/quotes", auth, async (req, res) => {
  const { tickers } = req.body;
  if (!tickers?.length) return res.json({});
  if (!FINNHUB_KEY) return res.json({});

  const results = {};
  // Fetch in parallel, max 10 at a time to respect rate limits
  const chunks = [];
  for (let i = 0; i < tickers.length; i += 10) {
    chunks.push(tickers.slice(i, i + 10));
  }
  for (const chunk of chunks) {
    const promises = chunk.map(async (ticker) => {
      const quote = await fetchQuote(ticker);
      if (quote) results[ticker] = quote;
    });
    await Promise.all(promises);
    // Small delay between chunks
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  res.json(results);
});

// ─── SCREENING ──────────────────────────────────────────────────────
app.post("/api/screen", auth, (req, res) => {
  const { criteria } = req.body;
  if (!criteria?.length) return res.status(400).json({ error: "Criteria required." });
  const stocks = db.prepare("SELECT * FROM stocks").all();
  const results = stocks.map(stock => {
    const details = criteria.map(c => {
      const val = stock[c.metricId];
      let pass = false;
      if (c.operator === "gt") pass = val > c.value;
      else if (c.operator === "lt") pass = val < c.value;
      else if (c.operator === "between") pass = val >= c.valueLow && val <= c.valueHigh;
      return { ...c, actual: val, pass };
    });
    const passed = details.filter(d => d.pass).length;
    return { ...stock, criteriaDetails: details, score: criteria.length > 0 ? Math.round((passed / criteria.length) * 100) : 0 };
  }).sort((a, b) => b.score - a.score);
  res.json(results);
});

// ─── WATCHLIST ───────────────────────────────────────────────────────
app.get("/api/watchlist", auth, (req, res) => {
  res.json(db.prepare(`SELECT w.ticker, s.* FROM watchlist w JOIN stocks s ON w.ticker = s.ticker
    WHERE w.user_id = ? ORDER BY w.added_at DESC`).all(req.userId));
});

app.post("/api/watchlist/:ticker", auth, (req, res) => {
  try {
    db.prepare("INSERT INTO watchlist (user_id, ticker) VALUES (?, ?)").run(req.userId, req.params.ticker.toUpperCase());
    res.json({ success: true });
  } catch { res.status(409).json({ error: "Already in watchlist." }); }
});

app.delete("/api/watchlist/:ticker", auth, (req, res) => {
  db.prepare("DELETE FROM watchlist WHERE user_id = ? AND ticker = ?").run(req.userId, req.params.ticker.toUpperCase());
  res.json({ success: true });
});

// ─── AI ANALYSIS ────────────────────────────────────────────────────
app.post("/api/analyze", auth, async (req, res) => {
  if (!ANTHROPIC_API_KEY) return res.status(400).json({ error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY in Replit Secrets." });
  const { stock, criteriaDetails } = req.body;
  const names = {
    pe_ratio: "P/E Ratio", debt_to_equity: "Debt-to-Equity", eps_growth: "EPS Growth (%)",
    dividend_yield: "Dividend Yield (%)", roe: "ROE (%)", revenue_growth: "Revenue Growth (%)",
    profit_margin: "Profit Margin (%)", current_ratio: "Current Ratio",
    market_cap_b: "Market Cap ($B)", beta: "Beta",
  };

  let breakdown = "No specific criteria were applied.";
  if (criteriaDetails?.length) {
    breakdown = criteriaDetails.map(d => {
      const op = d.operator === "gt" ? ">" : d.operator === "lt" ? "<" : "between";
      const thresh = d.operator === "between" ? `${d.valueLow}–${d.valueHigh}` : d.value;
      return `${names[d.metricId] || d.metricId}: actual=${d.actual}, threshold ${op} ${thresh}, ${d.pass ? "PASS" : "FAIL"}`;
    }).join("\n");
  }

  const prompt = `You are a financial analysis assistant for Investor Buddy. Analyze ${stock.name} (${stock.ticker}) in the ${stock.sector} sector.

${criteriaDetails?.length ? `Score: ${stock.score}/100\nCriteria breakdown:\n${breakdown}` : "No screening criteria were applied. Provide a general overview of the stock's financial health."}

Key data: Price $${stock.price}, P/E ${stock.pe_ratio}, D/E ${stock.debt_to_equity}, EPS Growth ${stock.eps_growth}%, Div Yield ${stock.dividend_yield}%, ROE ${stock.roe}%, Rev Growth ${stock.revenue_growth}%, Profit Margin ${stock.profit_margin}%, Current Ratio ${stock.current_ratio}, Market Cap $${stock.market_cap_b}B, Beta ${stock.beta}

Rules:
- Write 3-4 concise paragraphs
- ${criteriaDetails?.length ? "Explain which criteria passed/failed and why" : "Assess the stock's strengths and weaknesses based on its financial metrics"}
- Be factual and objective — no predictions or investment advice
- End with what the investor should consider further`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    res.json({ explanation: data.content?.map(b => b.text || "").join("") || "Unable to generate analysis." });
  } catch {
    res.status(500).json({ error: "AI analysis failed. Please try again." });
  }
});

// ─── SERVE FRONTEND ─────────────────────────────────────────────────
async function start() {
  const dist = join(__dirname, "dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("*", (req, res) => { if (!req.path.startsWith("/api")) res.sendFile(join(dist, "index.html")); });
  } else {
    try {
      const { createServer } = await import("vite");
      const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Vite failed:", err.message);
      app.get("*", (req, res) => { if (!req.path.startsWith("/api")) res.sendFile(join(__dirname, "index.html")); });
    }
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Investor Buddy → http://localhost:${PORT}`));
}
start();
