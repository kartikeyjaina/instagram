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
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const getAllowedOrigins = () => {
  const origins = env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins?.length ? origins : [env.FRONTEND_URL];
};

export const createApp = () => {
  const app = express();

  // Simple request logger to help debug missing routes
  app.use((req, _res, next) => {
    try {
      console.log(`[req] ${req.method} ${req.originalUrl}`);
    } catch (err) {
      console.error("Failed to log request:", err);
    }
    next();
  });

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (getAllowedOrigins().includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"), false);
      },
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) =>
    res.json({ success: true, data: { status: "OK" } }),
  );

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/posts", postRouter);
  app.use("/api/comments", commentRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/ai", aiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
