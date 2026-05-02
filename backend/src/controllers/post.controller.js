import { postModel } from "../models/post.model.js";
import { userModel } from "../models/user.model.js";
import { notificationModel } from "../models/notification.model.js";
import { imagekit } from "../config/imagekit.config.js";
import { toFile } from "@imagekit/nodejs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_POST_IMAGE_BYTES = 10 * 1024 * 1024;

const sanitizeFilename = (originalname) =>
  originalname
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);

const emitNotificationToUser = (req, targetUserId, payload) => {
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  if (!io || !onlineUsers) return;
  const socketId = onlineUsers.get(targetUserId.toString());
  if (socketId) io.to(socketId).emit("notification", payload);
};

export const createPost = async (req, res) => {
  const userId = req.user._id;
  const { caption } = req.body;

  if (!req.file) return res.status(400).json({ success: false, error: "Image is required" });

  const { mimetype, size, originalname, buffer } = req.file;

  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return res.status(400).json({ success: false, error: "Invalid file type. Only images allowed." });
  }
  if (size > MAX_POST_IMAGE_BYTES) {
    return res.status(400).json({ success: false, error: "File too large. Max 10 MB." });
  }

  const uploadResponse = await imagekit.files.upload({
    file: await toFile(buffer, originalname),
    fileName: `${sanitizeFilename(originalname)}_${Date.now()}`,
    folder: "/posts",
    useUniqueFileName: true,
  });

  const post = await postModel.create({
    user: userId,
    imageUrl: uploadResponse.url,
    caption: caption?.trim() || "",
  });

  await userModel.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

  const populated = await post.populate("user", "username profilePic");

  res.status(201).json({ success: true, data: { post: populated } });
};

export const getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    postModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "username profilePic"),
    postModel.countDocuments(),
  ]);

  res.status(200).json({ success: true, data: { posts, hasMore: skip + posts.length < total, page } });
};

export const getUserPosts = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    postModel.find({ user: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "username profilePic"),
    postModel.countDocuments({ user: id }),
  ]);

  res.status(200).json({ success: true, data: { posts, hasMore: skip + posts.length < total } });
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const post = await postModel.findById(id);
  if (!post) return res.status(404).json({ success: false, error: "Post not found" });
  if (post.user.toString() !== userId) {
    return res.status(403).json({ success: false, error: "Not authorized" });
  }

  await post.deleteOne();
  await userModel.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });

  res.status(200).json({ success: true, data: { message: "Post deleted" } });
};

export const likePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const post = await postModel
    .findByIdAndUpdate(id, { $addToSet: { likes: userId } }, { new: true })
    .populate("user", "username profilePic");

  if (!post) return res.status(404).json({ success: false, error: "Post not found" });

  const isNotSelfLike = post.user._id.toString() !== userId.toString();
  if (isNotSelfLike) {
    await notificationModel.create({ user: post.user._id, actor: userId, type: "like", referenceId: post._id });
    emitNotificationToUser(req, post.user._id, {
      type: "like",
      actor: { id: userId, username: req.user.username },
      postId: post._id,
    });
  }

  res.status(200).json({ success: true, data: { likes: post.likes, likesCount: post.likes.length } });
};

export const unlikePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const post = await postModel.findByIdAndUpdate(id, { $pull: { likes: userId } }, { new: true });
  if (!post) return res.status(404).json({ success: false, error: "Post not found" });

  res.status(200).json({ success: true, data: { likes: post.likes, likesCount: post.likes.length } });
};

export const getFeed = async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const currentUser = await userModel.findById(userId).select("following");
  const feedUserIds = [userId, ...currentUser.following];

  const [posts, total] = await Promise.all([
    postModel.find({ user: { $in: feedUserIds } }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("user", "username profilePic"),
    postModel.countDocuments({ user: { $in: feedUserIds } }),
  ]);

  res.status(200).json({ success: true, data: { posts, hasMore: skip + posts.length < total, page } });
};

export const savePost = async (req, res) => {
  await userModel.findByIdAndUpdate(req.user._id, { $addToSet: { savedPosts: req.params.id } });
  res.status(200).json({ success: true, data: { message: "Post saved" } });
};

export const unsavePost = async (req, res) => {
  await userModel.findByIdAndUpdate(req.user._id, { $pull: { savedPosts: req.params.id } });
  res.status(200).json({ success: true, data: { message: "Post unsaved" } });
};

export const getSavedPosts = async (req, res) => {
  const user = await userModel.findById(req.user._id).populate({
    path: "savedPosts",
    populate: { path: "user", select: "username profilePic" },
    options: { sort: { createdAt: -1 } },
  });

  res.status(200).json({ success: true, data: { posts: user.savedPosts } });
};
