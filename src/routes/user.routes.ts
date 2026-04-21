import { Router } from "express";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from "../validators/user.validator";
import { register, login, refresh, logout } from "../controllers/user.controller";

const router: Router = Router();

router.post("/auth/register", validate(registerSchema), register);

router.post("/auth/login", validate(loginSchema), login);

router.post("/auth/refresh", validate(refreshSchema), refresh);

router.post("/auth/logout", validate(logoutSchema), logout);

export default router;
