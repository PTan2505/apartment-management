import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
  recordVacancySchema,
  listExpensesQuerySchema,
  listVacancyDueQuerySchema,
} from "./schema.js";
import * as expenseService from "./service.js";

export async function createExpenseHandler(req: Request, res: Response) {
  const parsed = createExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("EXPENSE_PAYLOAD_INVALID", "Invalid expense payload", parsed.error.flatten());
  }

  const expense = await expenseService.createExpense(parsed.data);
  res.status(201).json(expense);
}

export async function listExpensesHandler(req: Request, res: Response) {
  const parsed = listExpensesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const expenses = await expenseService.listExpenses(parsed.data);
  res.status(200).json(expenses);
}

export async function getExpenseHandler(req: Request, res: Response) {
  const expense = await expenseService.getExpenseById(parseIdParam(req.params.id, RESOURCE.expense));
  res.status(200).json(expense);
}

export async function updateExpenseHandler(req: Request, res: Response) {
  const parsed = updateExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("EXPENSE_PAYLOAD_INVALID", "Invalid expense payload", parsed.error.flatten());
  }

  const expense = await expenseService.updateExpense(
    parseIdParam(req.params.id, RESOURCE.expense),
    parsed.data,
  );
  res.status(200).json(expense);
}

export async function deleteExpenseHandler(req: Request, res: Response) {
  await expenseService.deleteExpense(parseIdParam(req.params.id, RESOURCE.expense));
  res.status(204).send();
}

export async function listVacancyDueHandler(req: Request, res: Response) {
  const parsed = listVacancyDueQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const due = await expenseService.listVacancyDue(parsed.data);
  // A bare array: this is a worklist rather than a page of records.
  res.status(200).json({ data: due });
}

export async function recordVacancyHandler(req: Request, res: Response) {
  const parsed = recordVacancySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("VACANCY_PAYLOAD_INVALID", "Invalid vacancy payload", parsed.error.flatten());
  }

  const { expense, consumedUnits } = await expenseService.recordVacancyElectricity(parsed.data);

  // An unmoved meter is a valid outcome with nothing to charge, not an error.
  if (expense === null) {
    res.status(200).json({ expense: null, consumedUnits, message: "Meter unchanged; nothing to charge" });
    return;
  }

  res.status(201).json(expense);
}
