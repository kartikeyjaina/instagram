import { messageModel } from "../models/message.model.js";
import { userModel } from "../models/user.model.js";

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

  await messageModel.updateMany(
    { sender: userId, receiver: currentId, read: false },
    { read: true }
  );

  res.status(200).json({ success: true, data: { messages } });
};

export const getConversations = async (req, res) => {
  const currentId = req.user._id;

  const allMessages = await messageModel
    .find({ $or: [{ sender: currentId }, { receiver: currentId }] })
    .sort({ createdAt: -1 });

  const seenUserIds = new Set();
  const uniquePartnerIds = [];

  for (const msg of allMessages) {
    const partnerId =
      msg.sender.toString() === currentId.toString()
        ? msg.receiver.toString()
        : msg.sender.toString();

    if (!seenUserIds.has(partnerId)) {
      seenUserIds.add(partnerId);
      uniquePartnerIds.push(partnerId);
    }
  }

  const partners = await userModel.find({ _id: { $in: uniquePartnerIds } }).select("username profilePic");

  const conversations = await Promise.all(
    partners.map(async (partner) => {
      const lastMessage = await messageModel
        .findOne({
          $or: [
            { sender: currentId, receiver: partner._id },
            { sender: partner._id, receiver: currentId },
          ],
        })
        .sort({ createdAt: -1 });

      const unreadCount = await messageModel.countDocuments({
        sender: partner._id,
        receiver: currentId,
        read: false,
      });

      return { user: partner, lastMessage, unreadCount };
    })
  );

  res.status(200).json({ success: true, data: { conversations } });
};

export const sendMessage = async (req, res) => {
  const { receiverId, text } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !text?.trim()) {
    return res.status(400).json({ success: false, error: "receiverId and text are required" });
  }

  const receiver = await userModel.findById(receiverId);
  if (!receiver) return res.status(404).json({ success: false, error: "Receiver not found" });

  const message = await messageModel.create({ sender: senderId, receiver: receiverId, text: text.trim() });

  const populated = await message.populate([
    { path: "sender", select: "username profilePic" },
    { path: "receiver", select: "username profilePic" },
  ]);

  res.status(201).json({ success: true, data: { message: populated } });
};
