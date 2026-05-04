import { Server } from "socket.io";
import { messageModel } from "../models/message.model.js";
import { env } from "../config/env.config.js";

const onlineUsers = new Map();

const registerMessageHandlers = (io, socket, userId) => {
  socket.on("send_message", async ({ senderId, receiverId, text }) => {
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

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId)
        io.to(receiverSocketId).emit("receive_message", populated);

      socket.emit("receive_message", populated);
    } catch {
      socket.emit("error", { message: "Failed to send message" });
    }
  });
};

const registerTypingHandlers = (io, socket) => {
  socket.on("typing", ({ receiverId, senderId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("typing", { senderId });
  });

  socket.on("stop_typing", ({ receiverId, senderId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId)
      io.to(receiverSocketId).emit("stop_typing", { senderId });
  });
};

export const initializeSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    }

    registerMessageHandlers(io, socket, userId);
    registerTypingHandlers(io, socket);

    socket.on("disconnect", () => {
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("online_users", Array.from(onlineUsers.keys()));
      }
    });
  });

  app.set("io", io);
  app.set("onlineUsers", onlineUsers);
};
