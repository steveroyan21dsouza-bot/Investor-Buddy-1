import { Router } from "express";
import { db, stocksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || "";

function mapStock(s: typeof stocksTable.$inferSelect) {
  return {
    ticker: s.ticker,
    name: s.name,
    sector: s.sector,
    price: s.price,
    peRatio: s.peRatio,
    debtToEquity: s.debtToEquity,
    epsGrowth: s.epsGrowth,
    dividendYield: s.dividendYield,
    roe: s.roe,
    revenueGrowth: s.revenueGrowth,
    profitMargin: s.profitMargin,
    currentRatio: s.currentRatio,
    marketCapB: s.marketCapB,
    beta: s.beta,
    updatedAt: s.updatedAt.toISOString(),
  };
}

function parseAlphaVantageOverview(data: Record<string, string>, ticker: string) {
  return {
    ticker: data.Symbol || ticker,
    name: data.Name || ticker,
    sector: data.Sector || "Unknown",
    price: parseFloat(data["50DayMovingAverage"]) || parseFloat(data["200DayMovingAverage"]) || 0,
    peRatio: parseFloat(data.PERatio) || 0,
    debtToEquity: parseFloat(data.DebtToEquityRatio) || 0,
    epsGrowth: (parseFloat(data.QuarterlyEarningsGrowthYOY) || 0) * 100,
    dividendYield: (parseFloat(data.DividendYield) || 0) * 100,
    roe: (parseFloat(data.ReturnOnEquityTTM) || 0) * 100,
    revenueGrowth: (parseFloat(data.QuarterlyRevenueGrowthYOY) || 0) * 100,
    profitMargin: (parseFloat(data.ProfitMargin) || 0) * 100,
    currentRatio: parseFloat(data.CurrentRatio) || 0,
    marketCapB: Math.round((parseFloat(data.MarketCapitalization) || 0) / 1e9),
    beta: parseFloat(data.Beta) || 0,
  };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const stocks = await db.select().from(stocksTable).orderBy(stocksTable.ticker);
    res.json(stocks.map(mapStock));
  } catch (err) {
    req.log.error({ err }, "Get stocks error");
    res.status(500).json({ error: "Failed to fetch stocks" });
  }
});

router.get("/search/:query", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ALPHA_VANTAGE_KEY) {
    res.status(400).json({ error: "Alpha Vantage API key not configured. Add ALPHA_VANTAGE_KEY in Replit Secrets." });
    return;
  }
  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(req.params.query)}&apikey=${ALPHA_VANTAGE_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json() as Record<string, any>;

    if (data.Note || data.Information) {
      res.status(429).json({ error: "API rate limit reached. Try again in a minute." });
      return;
    }

    const existingTickers = await db.select({ ticker: stocksTable.ticker }).from(stocksTable);
    const inDb = new Set(existingTickers.map(s => s.ticker));

    const matches = ((data.bestMatches || []) as Record<string, string>[])
      .filter(m => m["4. region"] === "United States" || m["4. region"] === "United States/Canada")
      .slice(0, 8)
      .map(m => ({
        ticker: m["1. symbol"],
        name: m["2. name"],
        type: m["3. type"],
        region: m["4. region"],
        inDatabase: inDb.has(m["1. symbol"]),
      }));

    res.json(matches);
  } catch (err) {
    req.log.error({ err }, "Search stocks error");
    res.status(500).json({ error: "Search failed. Please try again." });
  }
});

router.post("/add/:ticker", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ALPHA_VANTAGE_KEY) {
    res.status(400).json({ error: "Alpha Vantage API key not configured." });
    return;
  }
  const ticker = req.params.ticker.toUpperCase();

  try {
    const [existing] = await db.select().from(stocksTable).where(eq(stocksTable.ticker, ticker));
    if (existing) {
      res.json(mapStock(existing));
      return;
    }

    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json() as Record<string, string>;

    if (data.Note || data.Information) {
      res.status(429).json({ error: "API rate limit reached. Try again later." });
      return;
    }
    if (!data.Symbol) {
      res.status(404).json({ error: `No data found for ${ticker}.` });
      return;
    }

    const stock = parseAlphaVantageOverview(data, ticker);
    const [inserted] = await db.insert(stocksTable).values(stock).returning();
    res.json(mapStock(inserted));
  } catch (err) {
    req.log.error({ err }, "Add stock error");
    res.status(500).json({ error: "Failed to fetch data from Alpha Vantage." });
  }
});

router.post("/refresh/:ticker", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!ALPHA_VANTAGE_KEY) {
    res.status(400).json({ error: "Alpha Vantage API key not configured." });
    return;
  }
  const ticker = req.params.ticker.toUpperCase();

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json() as Record<string, string>;

    if (data.Note || data.Information) {
      res.status(429).json({ error: "Rate limit reached. Try again in a minute." });
      return;
    }
    if (!data.Symbol) {
      res.status(404).json({ error: `No data found for ${ticker}.` });
      return;
    }

    const stock = parseAlphaVantageOverview(data, ticker);
    await db.update(stocksTable).set({ ...stock, updatedAt: new Date() }).where(eq(stocksTable.ticker, ticker));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Refresh stock error");
    res.status(500).json({ error: "Failed to refresh stock data." });
  }
});

router.get("/:ticker", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [stock] = await db.select().from(stocksTable).where(eq(stocksTable.ticker, req.params.ticker));
    if (!stock) {
      res.status(404).json({ error: "Stock not found." });
      return;
    }
    res.json(mapStock(stock));
  } catch (err) {
    req.log.error({ err }, "Get stock error");
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

router.delete("/:ticker", requireAuth, async (req: AuthenticatedRequest, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    await db.delete(stocksTable).where(eq(stocksTable.ticker, ticker));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete stock error");
    res.status(500).json({ error: "Failed to delete stock." });
  }
});

export default router;
