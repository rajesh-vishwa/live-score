import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.validation.js";
import { matchIdParamSchema } from "../validation/matches.validation.js";

const commentaryRouter = Router({ mergeParams: true });
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 100;

commentaryRouter.get("/", async (req, res, next) => {
  try {
    const paramsParse = matchIdParamSchema.safeParse(req.params);
    if (!paramsParse.success) {
      res.status(400).json({
        error: "Invalid match id",
        details: paramsParse.error.issues,
      });
      return;
    }

    const queryParse = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryParse.success) {
      res.status(400).json({
        error: "Invalid query",
        details: queryParse.error.issues,
      });
      return;
    }

    const limit = Math.min(queryParse.data.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const rows = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, paramsParse.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.status(200).json({ data: rows });
  } catch (err) {
    next(err);
  }
});

commentaryRouter.post("/", async (req, res, next) => {
  try {
    const paramsParse = matchIdParamSchema.safeParse(req.params);
    if (!paramsParse.success) {
      res.status(400).json({
        error: "Invalid match id",
        details: paramsParse.error.issues,
      });
      return;
    }

    const bodyParse = createCommentarySchema.safeParse(req.body);
    if (!bodyParse.success) {
      res.status(400).json({
        error: "Invalid commentary payload",
        details: bodyParse.error.issues,
      });
      return;
    }

    const [created] = await db
      .insert(commentary)
      .values({
        matchId: paramsParse.data.id,
        ...bodyParse.data,
      })
      .returning();

    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

export default commentaryRouter;
