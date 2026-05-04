import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { messageModel } from "../models/message.model.js";
import { userModel } from "../models/user.model.js";
import { env } from "../config/env.config.js";

const onlineUsers = new Map();

const registerMessageHandlers = (io, socket) => {
  socket.on("send_message", async ({ receiverId, text }) => {
    try {
      if (!receiverId || !receiverId.trim()) {
        return socket.emit("error", { message: "Invalid receiver" });
      }

      if (!text || !text.trim()) {
        return socket.emit("error", { message: "Message cannot be empty" });
      }

      const senderId = socket.user._id;

      const message = await messageModel.create({
        sender: senderId,
        receiver: receiverId,
        text: text.trim(),
        status: "sent",
      });

      const populated = await message.populate([
        { path: "sender", select: "username profilePic" },
        { path: "receiver", select: "username profilePic" },
      ]);

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", populated);
        await messageModel.findByIdAndUpdate(message._id, {
          status: "delivered",
        });
        io.to(socket.id).emit("message_delivered", { messageId: message._id });
      }

      socket.emit("receive_message", populated);
    } catch {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("message_seen", async ({ messageId }) => {
    try {
      if (!messageId) return;

      const message = await messageModel
        .findByIdAndUpdate(
          messageId,
          { status: "seen", read: true },
          { new: true },
        )
        .populate([
          { path: "sender", select: "username profilePic" },
          { path: "receiver", select: "username profilePic" },
        ]);

      if (message) {
        const senderSocketId = onlineUsers.get(message.sender._id.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("message_seen", {
            messageId,
            status: "seen",
          });
        }
      }
    } catch {
      socket.emit("error", { message: "Failed to update message status" });
    }
  });
};

const registerTypingHandlers = (io, socket) => {
  socket.on("typing", ({ receiverId }) => {
    if (!receiverId) return;

    const senderId = socket.user._id;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stop_typing", ({ receiverId }) => {
    if (!receiverId) return;

    const senderId = socket.user._id;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stop_typing", { senderId });
    }
  });
};

export const initializeSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = jwt.verify(token, env.JWT_SECRET);
      const userId = payload.id || payload.sub;
      const user = await userModel.findById(userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    onlineUsers.set(userId, socket.id);
    io.emit("online_users", Array.from(onlineUsers.keys()));

    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });

  app.set("io", io);
  app.set("onlineUsers", onlineUsers);
};
