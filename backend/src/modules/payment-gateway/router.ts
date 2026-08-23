import { Router } from "express";
import { webhookHandler } from "./controller.js";

/**
 * PUBLIC, and the second such router in this system. The portal's is
 * read-only; this one settles bills, which is why the signature is verified
 * before any part of the payload is read.
 */
export const paymentGatewayRouter = Router();

paymentGatewayRouter.post("/payos", webhookHandler);
