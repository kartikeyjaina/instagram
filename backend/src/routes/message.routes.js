import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getConversation, getConversations, sendMessage } from "../controllers/message.controller.js";

const messageRouter = Router();

messageRouter.get("/conversations", requireAuth, getConversations);
messageRouter.get("/:userId", requireAuth, getConversation);
messageRouter.post("/", requireAuth, sendMessage);

export default messageRouter;
