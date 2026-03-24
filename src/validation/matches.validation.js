import { z } from "zod";

const isoDatetimeChecker = z.iso.datetime();

const isoDateString = z
  .string()
  .refine((val) => isoDatetimeChecker.safeParse(val).success, {
    message: "Must be a valid ISO date string",
  });

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const MATCH_STATUS = {
  scheduled: "scheduled",
  live: "live",
  finished: "finished",
};

export const matchIdParamSchema = z.object({
  id: z.uuid(),
});

export const createMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    startTime: isoDateString,
    endTime: isoDateString,
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        message: "endTime must be after startTime",
        path: ["endTime"],
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});

export const updateMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    startTime: isoDateString,
    endTime: isoDateString,
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      if (end <= start) {
        ctx.addIssue({
          code: "custom",
          message: "endTime must be after startTime",
          path: ["endTime"],
        });
      }
    }
  });
