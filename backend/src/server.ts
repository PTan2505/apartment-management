import { env } from "@/config/env.js";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { NotFoundError } from "@/lib/errors.js";
import { errorHandler } from "@/middleware/error-handler.js";
import { requestLogger } from "@/middleware/request-logger.js";
import { healthRouter } from "@/routes/health.js";
import { authRouter } from "@/modules/auth/router.js";
import { buildingsRouter } from "@/modules/buildings/router.js";
import { roomsRouter } from "@/modules/rooms/router.js";
import { customersRouter } from "@/modules/customers/router.js";
import { leasesRouter } from "@/modules/leases/router.js";
import { invoicesRouter } from "@/modules/invoices/router.js";
import { expensesRouter } from "@/modules/expenses/router.js";
import { reportsRouter } from "@/modules/reports/router.js";
import { addressesRouter } from "@/modules/addresses/router.js";
import { depositsRouter } from "@/modules/deposits/router.js";
import { paymentsRouter } from "@/modules/payments/router.js";
import { tenantPortalRouter } from "@/modules/tenant-portal/router.js";
import { paymentGatewayRouter } from "@/modules/payment-gateway/router.js";

const app = express();

app.use(cors());

// Before the body parser, deliberately. The parser rejects a malformed body by
// throwing, and an error handler can only log through `req.log` — which the
// logger is what installs. Registered after it, a rejected body produced a
// response nobody could see afterwards: no request line, no error, nothing.
app.use(requestLogger);

app.use(express.json());
app.use(cookieParser());

app.use(healthRouter);
app.use("/auth", authRouter);
app.use("/buildings", buildingsRouter);
app.use("/rooms", roomsRouter);
app.use("/customers", customersRouter);
app.use("/leases", leasesRouter);
app.use("/invoices", invoicesRouter);
app.use("/expenses", expensesRouter);
app.use("/reports", reportsRouter);
app.use("/addresses", addressesRouter);
app.use("/deposits", depositsRouter);
app.use("/payments", paymentsRouter);

// PUBLIC. Every router above requires an owner's access token; this one takes a
// tenant's portal token instead, which grants sight of that person's own bills
// and nothing else. Kept apart from the block above so the difference is
// visible rather than buried in a list.
app.use("/portal", tenantPortalRouter);

// PUBLIC, and this one settles bills. Its defence is the signature on every
// confirmation, verified before the payload is read.
app.use("/webhooks", paymentGatewayRouter);

/**
 * Anything that matched no route above.
 *
 * Without this, Express answers with its own HTML page — a body every client
 * here tries to parse as JSON and fails on, reporting a syntax error in place
 * of the address that was wrong.
 *
 * It throws rather than responding, so the shape is still written in exactly
 * one place. Position is load-bearing in both directions: ahead of the routers
 * it would answer everything, and after the error handler it would never run.
 */
app.use((_req, _res, next) => {
  next(new NotFoundError("No route matches this address"));
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
