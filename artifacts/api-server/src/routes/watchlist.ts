import { Router } from "express";
import { db, watchlistTable, stocksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const items = await db.select({
      ticker: watchlistTable.ticker,
      addedAt: watchlistTable.addedAt,
      name: stocksTable.name,
      sector: stocksTable.sector,
      price: stocksTable.price,
    })
      .from(watchlistTable)
      .leftJoin(stocksTable, eq(watchlistTable.ticker, stocksTable.ticker))
      .where(eq(watchlistTable.userId, req.userId!))
      .orderBy(watchlistTable.addedAt);

    res.json(items.map(i => ({
      ticker: i.ticker,
      name: i.name || i.ticker,
      sector: i.sector || "Unknown",
      price: i.price || 0,
      addedAt: i.addedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Get watchlist error");
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

router.post("/:ticker", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await db.insert(watchlistTable)
      .values({ userId: req.userId!, ticker: req.params.ticker })
      .onConflictDoNothing();
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Add to watchlist error");
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

router.delete("/:ticker", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await db.delete(watchlistTable)
      .where(and(
        eq(watchlistTable.userId, req.userId!),
        eq(watchlistTable.ticker, req.params.ticker)
      ));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Remove from watchlist error");
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
});

export default router;
