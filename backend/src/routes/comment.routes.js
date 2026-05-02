import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createComment, getComments } from "../controllers/comment.controller.js";

const commentRouter = Router();

commentRouter.post("/", requireAuth, createComment);
commentRouter.get("/:postId", requireAuth, getComments);

export default commentRouter;
