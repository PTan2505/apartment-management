import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import {
  idCardConfirmSchema,
  idCardSideSchema,
  idCardUploadSchema,
  registerCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
} from "./schema.js";
import * as customerService from "./service.js";

export async function registerCustomerHandler(req: Request, res: Response) {
  const parsed = registerCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("CUSTOMER_PAYLOAD_INVALID", "Invalid customer payload", parsed.error.flatten());
  }

  const { customer, created } = await customerService.registerCustomer(parsed.data);
  // 200 signals the phone matched an existing person and their stored details
  // were kept, rather than a new record being created from this payload.
  res.status(created ? 201 : 200).json(customer);
}

export async function listCustomersHandler(req: Request, res: Response) {
  const parsed = listCustomersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const customers = await customerService.listCustomers(parsed.data);
  res.status(200).json(customers);
}

export async function getCustomerHandler(req: Request, res: Response) {
  const customer = await customerService.getCustomerById(parseIdParam(req.params.id, RESOURCE.customer));
  res.status(200).json(customer);
}

export async function updateCustomerHandler(req: Request, res: Response) {
  const parsed = updateCustomerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("CUSTOMER_PAYLOAD_INVALID", "Invalid customer payload", parsed.error.flatten());
  }

  const customer = await customerService.updateCustomer(
    parseIdParam(req.params.id, RESOURCE.customer),
    parsed.data,
  );
  res.status(200).json(customer);
}

export async function idCardUploadUrlHandler(req: Request, res: Response) {
  const parsed = idCardUploadSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError(
      "ID_CARD_UPLOAD_PAYLOAD_INVALID",
      "Invalid ID card upload request",
      parsed.error.flatten(),
    );
  }

  const signed = await customerService.signIdCardUpload(
    parseIdParam(req.params.id, RESOURCE.customer),
    parsed.data,
  );
  res.status(200).json(signed);
}

export async function idCardConfirmHandler(req: Request, res: Response) {
  const parsed = idCardConfirmSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError(
      "ID_CARD_CONFIRM_PAYLOAD_INVALID",
      "Invalid confirmation",
      parsed.error.flatten(),
    );
  }

  const customer = await customerService.confirmIdCardUpload(
    parseIdParam(req.params.id, RESOURCE.customer),
    parsed.data,
  );
  res.status(200).json(customer);
}

/** The side comes from the path here, so it is parsed the same way an id is. */
function parseSide(value: unknown) {
  const parsed = idCardSideSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError("ID_CARD_SIDE_INVALID", "Side must be front or back");
  }
  return parsed.data;
}

export async function idCardDownloadHandler(req: Request, res: Response) {
  const link = await customerService.getIdCardDownload(
    parseIdParam(req.params.id, RESOURCE.customer),
    parseSide(req.params.side),
  );
  res.status(200).json(link);
}

export async function idCardRemoveHandler(req: Request, res: Response) {
  const customer = await customerService.removeIdCard(
    parseIdParam(req.params.id, RESOURCE.customer),
    parseSide(req.params.side),
  );
  res.status(200).json(customer);
}
