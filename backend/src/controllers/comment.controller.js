import { commentModel } from "../models/comment.model.js";
import { postModel } from "../models/post.model.js";
import { notificationModel } from "../models/notification.model.js";
import { generateAIComment } from "../services/gemini.service.js";

// In-memory cooldown map: userId -> timestamp of last AI request
const aiCooldowns = new Map();
const AI_COOLDOWN_MS = 30_000; // 30 seconds

// POST /api/comments
export const createComment = async (req, res) => {
  const { postId, text } = req.body;
  const userId = req.user._id;

  if (!postId || !text?.trim()) {
    return res.status(400).json({ message: "postId and text are required" });
  }

  const post = await postModel.findById(postId).populate("user", "username");
  if (!post) return res.status(404).json({ message: "Post not found" });

  // Save the user's comment
  const comment = await commentModel.create({
    user: userId,
    post: postId,
    text: text.trim(),
    isAI: false,
  });

  const populated = await comment.populate("user", "username profilePic");

  // Notify post owner
  if (post.user._id.toString() !== userId.toString()) {
    await notificationModel.create({
      user: post.user._id,
      actor: userId,
      type: "comment",
      referenceId: post._id,
    });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const socketId = onlineUsers.get(post.user._id.toString());
      if (socketId) {
        io.to(socketId).emit("notification", {
          type: "comment",
          actor: { id: userId, username: req.user.username },
          postId: post._id,
        });
      }
    }
  }

  // Check for @ai trigger
  const aiMatch = text.trim().match(/^@ai\s+(.*)/i);
  let aiComment = null;

  if (aiMatch) {
    const userIdStr = userId.toString();
    const lastUsed = aiCooldowns.get(userIdStr);
    const now = Date.now();

    if (lastUsed && now - lastUsed < AI_COOLDOWN_MS) {
      const remaining = Math.ceil((AI_COOLDOWN_MS - (now - lastUsed)) / 1000);
      // Still return the user comment, just skip AI
      return res.status(201).json({
        comment: populated,
        aiComment: null,
        aiCooldown: remaining,
      });
    }

    aiCooldowns.set(userIdStr, now);

    try {
      const aiText = await generateAIComment(aiMatch[1], post.caption);
      aiComment = await commentModel.create({
        user: userId,
        post: postId,
        text: aiText,
        isAI: true,
      });
      await aiComment.populate("user", "username profilePic");

      // Notify post owner of AI reply
      await notificationModel.create({
        user: post.user._id,
        actor: userId,
        type: "ai_reply",
        referenceId: post._id,
      });
    } catch (err) {
      console.error("Gemini error:", err.message);
    }
  }

  return res.status(201).json({ comment: populated, aiComment });
};

// GET /api/comments/:postId
export const getComments = async (req, res) => {
  const { postId } = req.params;

  const comments = await commentModel
    .find({ post: postId })
    .sort({ createdAt: 1 })
    .populate("user", "username profilePic");

  return res.status(200).json({ comments });
};
