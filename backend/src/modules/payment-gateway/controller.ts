import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam } from "@/lib/parse-id.js";
import * as gatewayService from "./service.js";

/**
 * The gateway's confirmation endpoint. PUBLIC — anyone can post here, and the
 * signature is the whole of what stands in front of it.
 *
 * Always answers 200, whatever happened. A gateway that receives anything else
 * retries, and there is nothing to gain from having it retry a payload we have
 * already decided to reject. It also means a prober learns nothing from the
 * status code.
 */
export async function webhookHandler(req: Request, res: Response) {
  await gatewayService.applyWebhook(req.body ?? {});
  res.status(200).json({ received: true });
}

export async function reconcilePaymentHandler(req: Request, res: Response) {
  const paymentId = parseIdParam(req.params.id, "Payment");
  res.status(200).json(await gatewayService.reconcilePayment(paymentId));
}

export { ValidationError };
