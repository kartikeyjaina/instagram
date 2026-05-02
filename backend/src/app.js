import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRouter from "./routes/comment.routes.js";
import messageRouter from "./routes/message.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import aiRouter from "./routes/ai.routes.js";
import { messageModel } from "./models/message.model.js";

export const createApp = () => {
  const app = express();
  const httpServer = http.createServer(app);

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  const io = new Server(httpServer);

  // userId -> socketId map for online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    }

    // Real-time messaging
    socket.on("send_message", async (data) => {
      const { senderId, receiverId, text } = data;
      try {
        const message = await messageModel.create({
          sender: senderId,
          receiver: receiverId,
          text,
        });
        const populated = await message.populate([
          { path: "sender", select: "username profilePic" },
          { path: "receiver", select: "username profilePic" },
        ]);

        // Deliver to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", populated);
        }
        // Echo back to sender
        socket.emit("receive_message", populated);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing", ({ receiverId, senderId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { senderId });
      }
    });

    socket.on("stop_typing", ({ receiverId, senderId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stop_typing", { senderId });
      }
    });

    socket.on("disconnect", () => {
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("online_users", Array.from(onlineUsers.keys()));
      }
    });
  });

  // Make io and onlineUsers accessible in controllers via req.app
  app.set("io", io);
  app.set("onlineUsers", onlineUsers);

  // ── Middleware ────────────────────────────────────────────────────────────
  app.use(cors({ origin: "http://localhost:5174", credentials: true }));
  app.use(express.json());

  // ── Routes ────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => res.json({ status: "OK" }));
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/posts", postRouter);
  app.use("/api/comments", commentRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/ai", aiRouter);

  // ── Global error handler ──────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal server error" });
  });

  return { app, httpServer };
};
