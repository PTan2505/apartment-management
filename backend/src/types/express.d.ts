import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      log?: Logger;
      user?: { userId: number; role: string };
    }
  }
}

export {};
