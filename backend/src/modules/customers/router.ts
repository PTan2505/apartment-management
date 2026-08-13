import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  registerCustomerHandler,
  listCustomersHandler,
  getCustomerHandler,
  updateCustomerHandler,
} from "./controller.js";

export const customersRouter = Router();

customersRouter.use(authenticate, requireRole("owner"));

customersRouter.post("/", registerCustomerHandler);
customersRouter.get("/", listCustomersHandler);
customersRouter.get("/:id", getCustomerHandler);
customersRouter.patch("/:id", updateCustomerHandler);
