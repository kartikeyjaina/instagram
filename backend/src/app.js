import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.config.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRouter from "./routes/comment.routes.js";
import messageRouter from "./routes/message.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import aiRouter from "./routes/ai.routes.js";

const globalErrorHandler = (err, _req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ success: false, error: message });
};

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "OK" } }));

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/posts", postRouter);
  app.use("/api/comments", commentRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/ai", aiRouter);

  app.use(globalErrorHandler);

  return app;
};
