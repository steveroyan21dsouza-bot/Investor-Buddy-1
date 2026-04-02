import { Router } from "express";
import { db, stocksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

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

router.get("/", requireAuth, async (req, res) => {
  try {
    const stocks = await db.select().from(stocksTable).orderBy(stocksTable.ticker);
    res.json(stocks.map(mapStock));
  } catch (err) {
    req.log.error({ err }, "Get stocks error");
    res.status(500).json({ error: "Failed to fetch stocks" });
  }
});

router.get("/:ticker", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [stock] = await db.select().from(stocksTable).where(eq(stocksTable.ticker, req.params.ticker));
    if (!stock) {
      res.status(404).json({ error: "Stock not found" });
      return;
    }
    res.json(mapStock(stock));
  } catch (err) {
    req.log.error({ err }, "Get stock error");
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

export default router;
