import { commentModel } from "../models/comment.model.js";
import { postModel } from "../models/post.model.js";
import { notificationModel } from "../models/notification.model.js";
import { generateAIComment } from "../services/gemini.service.js";

const AI_COOLDOWN_MS = 30_000;
const aiCooldowns = new Map();

const isOnCooldown = (userId) => {
  const lastUsed = aiCooldowns.get(userId);
  return lastUsed && Date.now() - lastUsed < AI_COOLDOWN_MS;
};

const remainingCooldownSeconds = (userId) => {
  const lastUsed = aiCooldowns.get(userId);
  return Math.ceil((AI_COOLDOWN_MS - (Date.now() - lastUsed)) / 1000);
};

const emitNotification = (req, targetUserId, payload) => {
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  if (!io || !onlineUsers) return;
  const socketId = onlineUsers.get(targetUserId.toString());
  if (socketId) io.to(socketId).emit("notification", payload);
};

export const createComment = async (req, res) => {
  const { postId, text } = req.body;
  const userId = req.user._id;

  if (!postId || !text?.trim()) {
    return res.status(400).json({ success: false, error: "postId and text are required" });
  }

  const post = await postModel.findById(postId).populate("user", "username");
  if (!post) return res.status(404).json({ success: false, error: "Post not found" });

  const userComment = await commentModel.create({ user: userId, post: postId, text: text.trim(), isAI: false });
  const populated = await userComment.populate("user", "username profilePic");

  const isNotPostOwner = post.user._id.toString() !== userId.toString();
  if (isNotPostOwner) {
    await notificationModel.create({ user: post.user._id, actor: userId, type: "comment", referenceId: post._id });
    emitNotification(req, post.user._id, {
      type: "comment",
      actor: { id: userId, username: req.user.username },
      postId: post._id,
    });
  }

  const aiTriggerMatch = text.trim().match(/^@ai\s+(.*)/i);
  if (!aiTriggerMatch) {
    return res.status(201).json({ success: true, data: { comment: populated, aiComment: null } });
  }

  const userIdStr = userId.toString();
  if (isOnCooldown(userIdStr)) {
    return res.status(201).json({
      success: true,
      data: { comment: populated, aiComment: null, aiCooldown: remainingCooldownSeconds(userIdStr) },
    });
  }

  aiCooldowns.set(userIdStr, Date.now());

  let aiComment = null;
  try {
    const aiText = await generateAIComment(aiTriggerMatch[1], post.caption);
    aiComment = await commentModel.create({ user: userId, post: postId, text: aiText, isAI: true });
    await aiComment.populate("user", "username profilePic");

    await notificationModel.create({ user: post.user._id, actor: userId, type: "ai_reply", referenceId: post._id });
  } catch (err) {
    console.error("Gemini error:", err.message);
  }

  res.status(201).json({ success: true, data: { comment: populated, aiComment } });
};

export const getComments = async (req, res) => {
  const comments = await commentModel
    .find({ post: req.params.postId })
    .sort({ createdAt: 1 })
    .populate("user", "username profilePic");

  res.status(200).json({ success: true, data: { comments } });
};
