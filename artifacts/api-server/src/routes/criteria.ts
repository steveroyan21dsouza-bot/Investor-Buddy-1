import { Router } from "express";
import { db, criteriaSetsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router = Router();

function mapCriteriaSet(cs: typeof criteriaSetsTable.$inferSelect) {
  return {
    id: cs.id,
    name: cs.name,
    criteria: JSON.parse(cs.criteriaJson),
    createdAt: cs.createdAt.toISOString(),
    updatedAt: cs.updatedAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const sets = await db.select().from(criteriaSetsTable)
      .where(eq(criteriaSetsTable.userId, req.userId!))
      .orderBy(criteriaSetsTable.createdAt);
    res.json(sets.map(mapCriteriaSet));
  } catch (err) {
    req.log.error({ err }, "Get criteria sets error");
    res.status(500).json({ error: "Failed to fetch criteria sets" });
  }
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id, name, criteria } = req.body;
  if (!name || !criteria) {
    res.status(400).json({ error: "Name and criteria are required" });
    return;
  }

  try {
    const newId = id || randomUUID();
    // Upsert: if id provided, update; otherwise insert
    const existing = id ? await db.select().from(criteriaSetsTable)
      .where(and(eq(criteriaSetsTable.id, id), eq(criteriaSetsTable.userId, req.userId!)))
      .limit(1) : [];

    if (existing.length > 0) {
      const [updated] = await db.update(criteriaSetsTable)
        .set({ name, criteriaJson: JSON.stringify(criteria) })
        .where(and(eq(criteriaSetsTable.id, id), eq(criteriaSetsTable.userId, req.userId!)))
        .returning();
      res.status(201).json(mapCriteriaSet(updated));
    } else {
      const [created] = await db.insert(criteriaSetsTable)
        .values({ id: newId, userId: req.userId!, name, criteriaJson: JSON.stringify(criteria) })
        .returning();
      res.status(201).json(mapCriteriaSet(created));
    }
  } catch (err) {
    req.log.error({ err }, "Create criteria set error");
    res.status(500).json({ error: "Failed to save criteria set" });
  }
});

router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, criteria } = req.body;
  try {
    const [updated] = await db.update(criteriaSetsTable)
      .set({ name, criteriaJson: JSON.stringify(criteria) })
      .where(and(eq(criteriaSetsTable.id, req.params.id), eq(criteriaSetsTable.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Criteria set not found" });
      return;
    }
    res.json(mapCriteriaSet(updated));
  } catch (err) {
    req.log.error({ err }, "Update criteria set error");
    res.status(500).json({ error: "Failed to update criteria set" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await db.delete(criteriaSetsTable)
      .where(and(eq(criteriaSetsTable.id, req.params.id), eq(criteriaSetsTable.userId, req.userId!)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete criteria set error");
    res.status(500).json({ error: "Failed to delete criteria set" });
  }
});

export default router;
