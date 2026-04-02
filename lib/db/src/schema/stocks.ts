import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stocksTable = pgTable("stocks", {
  ticker: text("ticker").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  price: real("price").notNull().default(0),
  peRatio: real("pe_ratio").notNull().default(0),
  debtToEquity: real("debt_to_equity").notNull().default(0),
  epsGrowth: real("eps_growth").notNull().default(0),
  dividendYield: real("dividend_yield").notNull().default(0),
  roe: real("roe").notNull().default(0),
  revenueGrowth: real("revenue_growth").notNull().default(0),
  profitMargin: real("profit_margin").notNull().default(0),
  currentRatio: real("current_ratio").notNull().default(0),
  marketCapB: real("market_cap_b").notNull().default(0),
  beta: real("beta").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStockSchema = createInsertSchema(stocksTable).omit({ updatedAt: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocksTable.$inferSelect;
