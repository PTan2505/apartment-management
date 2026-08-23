import { Router } from "express";
import { prisma } from "@/lib/prisma.js";

export const healthRouter = Router();

const DB_PROBE_TIMEOUT_MS = 2000;

async function probeDatabase(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("Database probe timed out")), DB_PROBE_TIMEOUT_MS),
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

healthRouter.get("/health", async (_req, res) => {
  const databaseHealthy = await probeDatabase();

  if (databaseHealthy) {
    res.status(200).json({ status: "ok", database: "ok" });
    return;
  }

  res.status(503).json({ status: "error", database: "error" });
});
