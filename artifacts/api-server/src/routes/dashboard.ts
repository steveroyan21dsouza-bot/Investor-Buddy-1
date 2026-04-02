import { Router } from "express";
import { db, stocksTable, criteriaSetsTable, watchlistTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

router.get("/summary", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const [stockCount] = await db.select({ count: sql<number>`count(*)::int` }).from(stocksTable);
    const [criteriaCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(criteriaSetsTable).where(eq(criteriaSetsTable.userId, req.userId!));
    const [watchlistCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(watchlistTable).where(eq(watchlistTable.userId, req.userId!));
    const sectors = await db.selectDistinct({ sector: stocksTable.sector }).from(stocksTable);
    const [avgStats] = await db.select({
      avgPe: sql<number>`avg(pe_ratio)::numeric(10,2)`,
      avgEps: sql<number>`avg(eps_growth)::numeric(10,2)`,
    }).from(stocksTable);

    res.json({
      totalStocks: stockCount.count,
      totalCriteriaSets: criteriaCount.count,
      watchlistCount: watchlistCount.count,
      sectorsCount: sectors.length,
      avgPeRatio: parseFloat(String(avgStats.avgPe)) || 0,
      avgEpsGrowth: parseFloat(String(avgStats.avgEps)) || 0,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard summary error");
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

router.get("/sector-breakdown", requireAuth, async (req, res) => {
  try {
    const breakdown = await db.select({
      sector: stocksTable.sector,
      count: sql<number>`count(*)::int`,
    })
      .from(stocksTable)
      .groupBy(stocksTable.sector)
      .orderBy(desc(sql`count(*)`));

    res.json(breakdown);
  } catch (err) {
    req.log.error({ err }, "Sector breakdown error");
    res.status(500).json({ error: "Failed to fetch sector breakdown" });
  }
});

router.get("/top-performers", requireAuth, async (req, res) => {
  try {
    const stocks = await db.select().from(stocksTable)
      .orderBy(desc(stocksTable.epsGrowth))
      .limit(10);

    res.json(stocks.map(s => ({
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
    })));
  } catch (err) {
    req.log.error({ err }, "Top performers error");
    res.status(500).json({ error: "Failed to fetch top performers" });
  }
});

export default router;
