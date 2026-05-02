import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";

const notificationRouter = Router();

notificationRouter.get("/", requireAuth, getNotifications);
notificationRouter.patch("/read-all", requireAuth, markAllAsRead);
notificationRouter.patch("/:id/read", requireAuth, markAsRead);

export default notificationRouter;
