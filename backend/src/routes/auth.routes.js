import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), asyncHandler(register));
authRouter.post("/login", validate(loginSchema), asyncHandler(login));

export default authRouter;
