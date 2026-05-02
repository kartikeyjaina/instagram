import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createComment, getComments } from "../controllers/comment.controller.js";

const commentRouter = Router();

commentRouter.post("/", requireAuth, asyncHandler(createComment));
commentRouter.get("/:postId", requireAuth, asyncHandler(getComments));

export default commentRouter;
