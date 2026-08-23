import { Router } from "express";
import { prisma } from "@/lib/prisma.js";

export const healthRouter = Router();

const DB_PROBE_TIMEOUT_MS = 2000;

/**
 * Two questions, deliberately separated, because they have different answers
 * and different audiences.
 *
 * `/health` — is this process alive and serving? Render asks this every five
 * seconds, forever, to decide whether to route traffic here and whether to
 * restart. It touches nothing.
 *
 * `/health/db` — can it reach the database? A person asks this, after a deploy
 * or when something looks wrong.
 *
 * The database check used to be part of the first one, and putting it there was
 * wrong in two ways that only became visible in production:
 *
 *   - A 503 while the database was down would make Render take the service out
 *     of rotation. Callers would then get Render's opaque 502 instead of this
 *     application's own error, and restarting the process — which is what a
 *     failing health check leads to — cannot fix a database that is down.
 *
 *   - `SELECT 1` every five seconds is roughly seventeen thousand queries a
 *     day against a database whose free tier suspends when idle. It never got
 *     to idle. The health check alone was keeping it awake and billable.
 */
healthRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

healthRouter.get("/health/db", async (_req, res) => {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("Database probe timed out")), DB_PROBE_TIMEOUT_MS),
      ),
    ]);
    res.status(200).json({ status: "ok", database: "ok" });
  } catch {
    res.status(503).json({ status: "error", database: "error" });
  }
});
