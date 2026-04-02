import { Router } from "express";
import { db, stocksTable } from "@workspace/db";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router = Router();

interface Criterion {
  metric: string;
  operator: ">" | "<" | ">=" | "<=" | "between";
  value: number;
  value2?: number;
}

const METRIC_MAP: Record<string, keyof typeof stocksTable.$inferSelect> = {
  pe_ratio: "peRatio",
  debt_to_equity: "debtToEquity",
  eps_growth: "epsGrowth",
  dividend_yield: "dividendYield",
  roe: "roe",
  revenue_growth: "revenueGrowth",
  profit_margin: "profitMargin",
  current_ratio: "currentRatio",
  market_cap_b: "marketCapB",
  beta: "beta",
};

function getStockValue(stock: typeof stocksTable.$inferSelect, metric: string): number {
  const field = METRIC_MAP[metric];
  if (!field) return 0;
  return (stock[field] as number) || 0;
}

function evaluateCriterion(value: number, criterion: Criterion): boolean {
  switch (criterion.operator) {
    case ">": return value > criterion.value;
    case "<": return value < criterion.value;
    case ">=": return value >= criterion.value;
    case "<=": return value <= criterion.value;
    case "between": return value >= criterion.value && value <= (criterion.value2 ?? criterion.value);
    default: return false;
  }
}

function scoreStock(stock: typeof stocksTable.$inferSelect, criteria: Criterion[]): { score: number; results: { metric: string; passed: boolean; value: number }[] } {
  if (criteria.length === 0) return { score: 100, results: [] };

  const results = criteria.map(c => {
    const value = getStockValue(stock, c.metric);
    return {
      metric: c.metric,
      passed: evaluateCriterion(value, c),
      value,
    };
  });

  const passed = results.filter(r => r.passed).length;
  const score = Math.round((passed / criteria.length) * 100);
  return { score, results };
}

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { criteria } = req.body;
  if (!criteria || !Array.isArray(criteria)) {
    res.status(400).json({ error: "criteria array is required" });
    return;
  }

  try {
    const stocks = await db.select().from(stocksTable);
    const results = stocks.map(stock => {
      const { score, results: criteriaResults } = scoreStock(stock, criteria);
      return {
        ticker: stock.ticker,
        name: stock.name,
        sector: stock.sector,
        score,
        price: stock.price,
        peRatio: stock.peRatio,
        debtToEquity: stock.debtToEquity,
        epsGrowth: stock.epsGrowth,
        dividendYield: stock.dividendYield,
        roe: stock.roe,
        revenueGrowth: stock.revenueGrowth,
        profitMargin: stock.profitMargin,
        currentRatio: stock.currentRatio,
        marketCapB: stock.marketCapB,
        beta: stock.beta,
        criteriaResults,
      };
    }).sort((a, b) => b.score - a.score);

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Screen stocks error");
    res.status(500).json({ error: "Screening failed" });
  }
});

export default router;
