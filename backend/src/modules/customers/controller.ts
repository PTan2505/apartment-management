import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import {
  registerCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
} from "./schema.js";
import * as customerService from "./service.js";

export async function registerCustomerHandler(req: Request, res: Response) {
  const parsed = registerCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid customer payload", parsed.error.flatten());
  }

  const { customer, created } = await customerService.registerCustomer(parsed.data);
  // 200 signals the phone matched an existing person and their stored details
  // were kept, rather than a new record being created from this payload.
  res.status(created ? 201 : 200).json(customer);
}

export async function listCustomersHandler(req: Request, res: Response) {
  const parsed = listCustomersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.flatten());
  }

  const customers = await customerService.listCustomers(parsed.data);
  res.status(200).json(customers);
}

export async function getCustomerHandler(req: Request, res: Response) {
  const customer = await customerService.getCustomerById(req.params.id as string);
  res.status(200).json(customer);
}

export async function updateCustomerHandler(req: Request, res: Response) {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid customer payload", parsed.error.flatten());
  }

  const customer = await customerService.updateCustomer(
    req.params.id as string,
    parsed.data,
  );
  res.status(200).json(customer);
}
