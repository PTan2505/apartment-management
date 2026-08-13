import { env } from "@/config/env.js";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "@/middleware/error-handler.js";
import { requestLogger } from "@/middleware/request-logger.js";
import { healthRouter } from "@/routes/health.js";
import { authRouter } from "@/modules/auth/router.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use(healthRouter);
app.use("/auth", authRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
