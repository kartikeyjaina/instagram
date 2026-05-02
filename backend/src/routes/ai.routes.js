import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateCaptionHandler } from "../controllers/ai.controller.js";

const aiRouter = Router();

aiRouter.post("/generate-caption", requireAuth, asyncHandler(generateCaptionHandler));

export default aiRouter;
