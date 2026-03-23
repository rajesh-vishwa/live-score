import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import {
  createMatchSchema,
  listMatchesQuerySchema,
  updateMatchSchema,
} from "../validation/matches.validation.js";
import { getMatchStatus } from "../utils/match.status.js";

const idParamSchema = z.object({
  id: z.uuid(),
});

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const matchRouter = Router();

// get all matches
matchRouter.get("/", async (_req, res, next) => {
  const parsed = listMatchesQuerySchema.safeParse(_req.query);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid query ",
      details: parsed.error.issues,
    });
    return;
  }

  const limit = Math.min(parsed.data.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  try {
    const rows = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    res.json(
      rows.map((row) => ({
        ...row,
        status: getMatchStatus(row.startTime, row.endTime),
      })),
    );
  } catch (err) {
    next(err);
  }
});

matchRouter.get("/:id", async (req, res, next) => {
  try {
    const parse = idParamSchema.safeParse(req.params);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid match id" });
      return;
    }
    const [row] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, parse.data.id));
    if (!row) {
      res.status(404).json({ error: "Match not found" });
      return;
    }
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

matchRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid match data payload",
        details: parsed.error.issues,
      });
      return;
    }
    const body = parsed.data;
    const [event] = await db
      .insert(matches)
      .values({
        sport: body.sport,
        homeTeam: body.homeTeam,
        awayTeam: body.awayTeam,
        status: getMatchStatus(body.startTime, body.endTime),
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        homeScore: body.homeScore ?? 0,
        awayScore: body.awayScore ?? 0,
      })
      .returning();

    if (typeof res.app.locals.broadcastMatchCreated === "function") {
      try {
        res.app.locals.broadcastMatchCreated(event);
      } catch (broadcastErr) {
        console.error("broadcastMatchCreated failed", broadcastErr);
      }
    }

    res.status(201).json({ data: event });
  } catch (err) {
    next(err);
  }
});

matchRouter.patch("/:id", async (req, res, next) => {
  try {
    const idParse = idParamSchema.safeParse(req.params);
    if (!idParse.success) {
      res.status(400).json({ error: "Invalid match id" });
      return;
    }
    const parse = updateMatchSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.flatten() });
      return;
    }
    const body = parse.data;
    const entries = Object.entries(body).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }
    const patch = Object.fromEntries(entries);
    patch.updatedAt = new Date();
    const [row] = await db
      .update(matches)
      .set(patch)
      .where(eq(matches.id, idParse.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Match not found" });
      return;
    }
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

matchRouter.delete("/:id", async (req, res, next) => {
  try {
    const parse = idParamSchema.safeParse(req.params);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid match id" });
      return;
    }
    const [row] = await db
      .delete(matches)
      .where(eq(matches.id, parse.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Match not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default matchRouter;
