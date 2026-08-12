import { env } from "./config/env.js";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/request-logger.js";
import { healthRouter } from "./routes/health.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use(healthRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
