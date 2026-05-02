import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getConversation, getConversations, sendMessage } from "../controllers/message.controller.js";

const messageRouter = Router();

messageRouter.get("/conversations", requireAuth, asyncHandler(getConversations));
messageRouter.get("/:userId", requireAuth, asyncHandler(getConversation));
messageRouter.post("/", requireAuth, asyncHandler(sendMessage));

export default messageRouter;
