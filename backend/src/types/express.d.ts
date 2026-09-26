import type { Logger } from "pino";
import type { BuildingScope } from "@/middleware/staff-scope.js";

declare global {
  namespace Express {
    interface Request {
      log?: Logger;
      user?: { userId: number; role: string };
      /**
       * Which buildings this request may see: an array for staff, null for an
       * owner, who is not narrowed. Set by `resolveStaffScope`.
       */
      buildingScope?: BuildingScope;
    }
  }
}

export {};
