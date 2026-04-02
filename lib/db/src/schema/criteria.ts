import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const criteriaSetsTable = pgTable("criteria_sets", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  criteriaJson: text("criteria_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCriteriaSetSchema = createInsertSchema(criteriaSetsTable).omit({ createdAt: true, updatedAt: true });
export type InsertCriteriaSet = z.infer<typeof insertCriteriaSetSchema>;
export type CriteriaSet = typeof criteriaSetsTable.$inferSelect;
