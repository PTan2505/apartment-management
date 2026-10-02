import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { accountGuard } from "@/middleware/staff-scope.js";
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

/*
  Staff READ what their buildings cost; only the owner writes it.

  A manager runs a building and has to see what running it costs, so every
  listing stays open to them. But stating what the business SPENT is the same
  kind of declaration as stating that money arrived — which they already may
  not make — and it reduces the earnings they are not allowed to read.

  There is a second, concrete reason the split had to happen here and not only
  at the damage report: a repair's cost IS one of these rows. Restricting it to
  the owner on the report while leaving it editable on this screen would have
  been a rule that read well and enforced nothing.
*/
expensesRouter.use(authenticate, accountGuard, requireRole("owner", "manager"));

expensesRouter.post("/", requireRole("owner"), createExpenseHandler);
expensesRouter.get("/", listExpensesHandler);
expensesRouter.post("/vacancy-electricity", requireRole("owner"), recordVacancyHandler);
// Which empty rooms still need their electricity recorded for a month.
// Registered before "/:id" so the literal path is not read as an id.
expensesRouter.get("/vacancy-electricity/due", listVacancyDueHandler);
expensesRouter.get("/:id", getExpenseHandler);
expensesRouter.patch("/:id", requireRole("owner"), updateExpenseHandler);
expensesRouter.delete("/:id", requireRole("owner"), deleteExpenseHandler);
