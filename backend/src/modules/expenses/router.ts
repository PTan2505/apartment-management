import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  createExpenseHandler,
  listExpensesHandler,
  getExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  recordVacancyHandler,
} from "./controller.js";

export const expensesRouter = Router();

expensesRouter.use(authenticate, requireRole("owner"));

expensesRouter.post("/", createExpenseHandler);
expensesRouter.get("/", listExpensesHandler);
expensesRouter.post("/vacancy-electricity", recordVacancyHandler);
expensesRouter.get("/:id", getExpenseHandler);
expensesRouter.patch("/:id", updateExpenseHandler);
expensesRouter.delete("/:id", deleteExpenseHandler);
