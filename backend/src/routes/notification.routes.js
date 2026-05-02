import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";

const notificationRouter = Router();

notificationRouter.get("/", requireAuth, asyncHandler(getNotifications));
notificationRouter.patch("/read-all", requireAuth, asyncHandler(markAllAsRead));
notificationRouter.patch("/:id/read", requireAuth, asyncHandler(markAsRead));

export default notificationRouter;
