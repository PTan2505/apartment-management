import { pinoHttp } from "pino-http";
import { env } from "@/config/env.js";

export const requestLogger = pinoHttp({
  level: env.NODE_ENV === "production" ? "info" : "debug",
});
