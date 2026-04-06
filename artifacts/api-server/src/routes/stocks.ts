import { Router } from "express";
import { db, stocksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || "";

const SECTOR_MAP: Record<string, string> = {
  "Technology": "Technology",
  "Information Technology": "Technology",
  "Communication Services": "Technology",
  "Health Care": "Healthcare",
  "Healthcare": "Healthcare",
  "Financials": "Financial",
  "Financial Services": "Financial",
  "Finance": "Financial",
  "Consumer Discretionary": "Consumer",
  "Consumer Staples": "Consumer",
  "Consumer": "Consumer",
  "Industrials": "Industrial",
  "Industrial": "Industrial",
  "Materials": "Industrial",
  "Energy": "Energy",
  "Utilities": "Utilities",
  "Real Estate": "Financial",
};

function normalizeSector(raw: string | undefined): string {
  if (!raw) return "Unknown";
  return SECTOR_MAP[raw] ?? raw;
}

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

async function fetchFinnhubStock(ticker: string): Promise<Partial<typeof stocksTable.$inferInsert> | null> {
  const base = "https://finnhub.io/api/v1";
  const t = FINNHUB_KEY;

  const [profileRes, quoteRes, metricRes] = await Promise.all([
    fetch(`${base}/stock/profile2?symbol=${ticker}&token=${t}`),
    fetch(`${base}/quote?symbol=${ticker}&token=${t}`),
    fetch(`${base}/stock/metric?symbol=${ticker}&metric=all&token=${t}`),
  ]);

  const [profile, quote, metricData] = await Promise.all([
    profileRes.json() as Promise<Record<string, any>>,
    quoteRes.json() as Promise<Record<string, any>>,
    metricRes.json() as Promise<Record<string, any>>,
  ]);

  const price = quote.c ?? 0;
  if (!price && !profile.name) return null;

  const m = metricData.metric ?? {};

  return {
    ticker,
    name: profile.name || ticker,
    sector: normalizeSector(profile.finnhubIndustry),
    price: price || 0,
    peRatio: m.peBasicExclExtraTTM ?? m.peNormalizedAnnual ?? 0,
    debtToEquity: m.debtToEquityAnnual ?? 0,
    epsGrowth: m.epsGrowthTTMYoy ?? 0,
    dividendYield: m.dividendYieldIndicatedAnnual ?? 0,
    roe: (m.roeTTM ?? 0) * 100,
    revenueGrowth: m.revenueGrowthTTMYoy ?? 0,
    profitMargin: (m.netProfitMarginTTM ?? m.netProfitMarginAnnual ?? 0) * 100,
    currentRatio: m.currentRatioAnnual ?? 0,
    marketCapB: Math.round((profile.marketCapitalization ?? m.marketCapitalization ?? 0) / 1000),
    beta: m.beta ?? profile.beta ?? 0,
  };
}

async function fetchFinnhubQuote(ticker: string): Promise<number | null> {
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
  const data = await res.json() as Record<string, any>;
  return data.c ?? null;
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
  const ticker = req.params.ticker.toUpperCase();

  try {
    const [existing] = await db.select().from(stocksTable).where(eq(stocksTable.ticker, ticker));
    if (existing) {
      res.json(mapStock(existing));
      return;
    }

    if (FINNHUB_KEY) {
      const stock = await fetchFinnhubStock(ticker);
      if (!stock) {
        res.status(404).json({ error: `No data found for ${ticker}.` });
        return;
      }
      const [inserted] = await db.insert(stocksTable).values({ ...stock, updatedAt: new Date() }).returning();
      res.json(mapStock(inserted));
      return;
    }

    if (!ALPHA_VANTAGE_KEY) {
      res.status(400).json({ error: "No data provider configured. Add FINNHUB_API_KEY or ALPHA_VANTAGE_KEY in Replit Secrets." });
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
    const stock = {
      ticker: data.Symbol || ticker,
      name: data.Name || ticker,
      sector: normalizeSector(data.Sector),
      price: parseFloat(data["50DayMovingAverage"]) || 0,
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
    const [inserted] = await db.insert(stocksTable).values(stock).returning();
    res.json(mapStock(inserted));
  } catch (err) {
    req.log.error({ err }, "Add stock error");
    res.status(500).json({ error: "Failed to fetch data from provider." });
  }
});

router.post("/refresh/:ticker", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!FINNHUB_KEY) {
    res.status(400).json({ error: "Finnhub API key not configured. Add FINNHUB_API_KEY in Replit Secrets." });
    return;
  }
  const ticker = req.params.ticker.toUpperCase();

  try {
    const stock = await fetchFinnhubStock(ticker);
    if (!stock) {
      res.status(404).json({ error: `No data found for ${ticker}.` });
      return;
    }
    await db.update(stocksTable).set({ ...stock, updatedAt: new Date() }).where(eq(stocksTable.ticker, ticker));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Refresh stock error");
    res.status(500).json({ error: "Failed to refresh stock data." });
  }
});

router.post("/refresh-all", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!FINNHUB_KEY) {
    res.status(400).json({ error: "Finnhub API key not configured." });
    return;
  }

  res.status(202).json({ message: "Price refresh started. All 77 stocks will update over the next ~2 minutes." });

  const stocks = await db.select({ ticker: stocksTable.ticker }).from(stocksTable);
  const DELAY_MS = 1200;

  (async () => {
    for (const { ticker } of stocks) {
      try {
        const price = await fetchFinnhubQuote(ticker);
        if (price && price > 0) {
          await db.update(stocksTable)
            .set({ price, updatedAt: new Date() })
            .where(eq(stocksTable.ticker, ticker));
        }
      } catch {
        // skip failed tickers silently
      }
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
    req.log.info("Refresh-all complete");
  })();
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
