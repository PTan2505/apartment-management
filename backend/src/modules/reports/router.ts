import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import { revenueReportHandler } from "./controller.js";

export const reportsRouter = Router();

reportsRouter.use(authenticate, requireRole("owner"));

reportsRouter.get("/revenue", revenueReportHandler);
