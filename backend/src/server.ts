import { env } from "@/config/env.js";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "@/middleware/error-handler.js";
import { requestLogger } from "@/middleware/request-logger.js";
import { healthRouter } from "@/routes/health.js";
import { authRouter } from "@/modules/auth/router.js";
import { buildingsRouter } from "@/modules/buildings/router.js";
import { roomsRouter } from "@/modules/rooms/router.js";
import { customersRouter } from "@/modules/customers/router.js";
import { leasesRouter } from "@/modules/leases/router.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use(healthRouter);
app.use("/auth", authRouter);
app.use("/buildings", buildingsRouter);
app.use("/rooms", roomsRouter);
app.use("/customers", customersRouter);
app.use("/leases", leasesRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
