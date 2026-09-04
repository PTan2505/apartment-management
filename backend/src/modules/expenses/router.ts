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
  listVacancyDueHandler,
} from "./controller.js";

export const expensesRouter = Router();

expensesRouter.use(authenticate, requireRole("owner"));

expensesRouter.post("/", createExpenseHandler);
expensesRouter.get("/", listExpensesHandler);
expensesRouter.post("/vacancy-electricity", recordVacancyHandler);
// Which empty rooms still need their electricity recorded for a month.
// Registered before "/:id" so the literal path is not read as an id.
expensesRouter.get("/vacancy-electricity/due", listVacancyDueHandler);
expensesRouter.get("/:id", getExpenseHandler);
expensesRouter.patch("/:id", updateExpenseHandler);
expensesRouter.delete("/:id", deleteExpenseHandler);
