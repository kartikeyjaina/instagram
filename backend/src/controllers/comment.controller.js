import { commentModel } from "../models/comment.model.js";
import { postModel } from "../models/post.model.js";
import { notificationModel } from "../models/notification.model.js";

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
    return res
      .status(400)
      .json({ success: false, error: "postId and text are required" });
  }

  const post = await postModel.findById(postId).populate("user", "username");
  if (!post)
    return res.status(404).json({ success: false, error: "Post not found" });

  const userComment = await commentModel.create({
    user: userId,
    post: postId,
    text: text.trim(),
    isAI: false,
  });
  const populated = await userComment.populate("user", "username profilePic");

  const isNotPostOwner = post.user._id.toString() !== userId.toString();
  if (isNotPostOwner) {
    await notificationModel.create({
      user: post.user._id,
      actor: userId,
      type: "comment",
      referenceId: post._id,
    });
    emitNotification(req, post.user._id, {
      type: "comment",
      actor: { id: userId, username: req.user.username },
      postId: post._id,
    });
  }

  res.status(201).json({ success: true, data: { comment: populated } });
};

export const createAiReply = async (req, res) => {
  const { postId, text, replyToCommentId } = req.body;
  const userId = req.user._id;

  if (!postId || !text?.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "postId and text are required" });
  }

  const post = await postModel.findById(postId).populate("user", "username");
  if (!post)
    return res.status(404).json({ success: false, error: "Post not found" });

  let replyToComment = null;
  if (replyToCommentId) {
    replyToComment = await commentModel
      .findById(replyToCommentId)
      .populate("user", "username");
    if (
      !replyToComment ||
      replyToComment.post.toString() !== postId.toString()
    ) {
      return res
        .status(404)
        .json({ success: false, error: "Reply target not found" });
    }
  }

  const draftedReply = await commentModel.create({
    user: userId,
    post: postId,
    replyTo: replyToComment?._id || null,
    text: text.trim(),
    isAI: false,
  });

  const populated = await draftedReply.populate([
    { path: "user", select: "username profilePic" },
    {
      path: "replyTo",
      populate: { path: "user", select: "username profilePic" },
    },
  ]);

  const notificationTarget =
    replyToComment?.user?._id ||
    (post.user._id.toString() !== userId.toString() ? post.user._id : null);
  if (notificationTarget) {
    await notificationModel.create({
      user: notificationTarget,
      actor: userId,
      type: "comment",
      referenceId: replyToComment?._id || post._id,
    });
    emitNotification(req, notificationTarget, {
      type: "comment",
      actor: { id: userId, username: req.user.username },
      postId: post._id,
    });
  }

  res.status(201).json({ success: true, data: { comment: populated } });
};

export const getComments = async (req, res) => {
  const comments = await commentModel
    .find({ post: req.params.postId })
    .sort({ createdAt: 1 })
    .populate("user", "username profilePic")
    .populate({
      path: "replyTo",
      populate: { path: "user", select: "username profilePic" },
    });

  res.status(200).json({ success: true, data: { comments } });
};
