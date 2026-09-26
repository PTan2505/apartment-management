import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import {
  changePasswordHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from "./controller.js";

export const authRouter = Router();

authRouter.post("/login", loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);

// The only authenticated route in this module. The middleware is applied here
// rather than to the whole router, because login, refresh, and logout are
// reached precisely when the caller has no usable access token.
authRouter.get("/me", authenticate, meHandler);
// Authenticated but NOT behind `accountGuard`: an account that owes a password
// change must be able to change it, and that guard is what refuses everything
// else until it has.
authRouter.post("/password", authenticate, changePasswordHandler);
