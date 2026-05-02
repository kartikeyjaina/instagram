import { messageModel } from "../models/message.model.js";
import { userModel } from "../models/user.model.js";

// GET /api/messages/:userId  — conversation between current user and :userId
export const getConversation = async (req, res) => {
  const currentId = req.user._id;
  const { userId } = req.params;

  const messages = await messageModel
    .find({
      $or: [
        { sender: currentId, receiver: userId },
        { sender: userId, receiver: currentId },
      ],
    })
    .sort({ createdAt: 1 })
    .populate("sender", "username profilePic")
    .populate("receiver", "username profilePic");

  // Mark received messages as read
  await messageModel.updateMany(
    { sender: userId, receiver: currentId, read: false },
    { read: true }
  );

  return res.status(200).json({ messages });
};

// GET /api/messages/conversations  — list of recent conversations
export const getConversations = async (req, res) => {
  const currentId = req.user._id;

  // Get unique users this user has chatted with
  const messages = await messageModel
    .find({
      $or: [{ sender: currentId }, { receiver: currentId }],
    })
    .sort({ createdAt: -1 });

  const seenUsers = new Set();
  const conversationUserIds = [];

  for (const msg of messages) {
    const otherId =
      msg.sender.toString() === currentId.toString()
        ? msg.receiver.toString()
        : msg.sender.toString();

    if (!seenUsers.has(otherId)) {
      seenUsers.add(otherId);
      conversationUserIds.push(otherId);
    }
  }

  const users = await userModel
    .find({ _id: { $in: conversationUserIds } })
    .select("username profilePic");

  // Attach last message and unread count
  const conversations = await Promise.all(
    users.map(async (user) => {
      const lastMsg = await messageModel
        .findOne({
          $or: [
            { sender: currentId, receiver: user._id },
            { sender: user._id, receiver: currentId },
          ],
        })
        .sort({ createdAt: -1 });

      const unread = await messageModel.countDocuments({
        sender: user._id,
        receiver: currentId,
        read: false,
      });

      return { user, lastMessage: lastMsg, unreadCount: unread };
    })
  );

  return res.status(200).json({ conversations });
};

// POST /api/messages  — send via REST (Socket.IO is primary)
export const sendMessage = async (req, res) => {
  const { receiverId, text } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !text?.trim()) {
    return res.status(400).json({ message: "receiverId and text are required" });
  }

  const receiver = await userModel.findById(receiverId);
  if (!receiver) return res.status(404).json({ message: "Receiver not found" });

  const message = await messageModel.create({
    sender: senderId,
    receiver: receiverId,
    text: text.trim(),
  });

  const populated = await message.populate([
    { path: "sender", select: "username profilePic" },
    { path: "receiver", select: "username profilePic" },
  ]);

  return res.status(201).json({ message: populated });
};
