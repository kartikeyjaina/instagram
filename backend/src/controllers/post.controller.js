import { postModel } from "../models/post.model.js";
import { userModel } from "../models/user.model.js";
import { notificationModel } from "../models/notification.model.js";
import { imagekit } from "../config/imagekit.config.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// POST /api/posts
export const createPost = async (req, res) => {
  const userId = req.user._id;
  const { caption } = req.body;

  if (!req.file) return res.status(400).json({ message: "Image is required" });

  const { mimetype, size, originalname, buffer } = req.file;

  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return res.status(400).json({ message: "Invalid file type. Only images allowed." });
  }
  if (size > 10 * 1024 * 1024) {
    return res.status(400).json({ message: "File too large. Max 10 MB." });
  }

  const baseName = originalname
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);

  const uploadResponse = await imagekit.upload({
    file: buffer,
    fileName: `${baseName}_${Date.now()}`,
    folder: "/posts",
    useUniqueFileName: true,
  });

  const post = await postModel.create({
    user: userId,
    imageUrl: uploadResponse.url,
    caption: caption?.trim() || "",
  });

  // Increment postsCount
  await userModel.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

  const populated = await post.populate("user", "username profilePic");

  return res.status(201).json({ post: populated });
};

// GET /api/posts  (all posts, latest first, paginated)
export const getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const posts = await postModel
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "username profilePic");

  const total = await postModel.countDocuments();

  return res.status(200).json({
    posts,
    hasMore: skip + posts.length < total,
    page,
  });
};

// GET /api/posts/user/:id
export const getUserPosts = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const posts = await postModel
    .find({ user: id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "username profilePic");

  const total = await postModel.countDocuments({ user: id });

  return res.status(200).json({ posts, hasMore: skip + posts.length < total });
};

// DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id.toString();

  const post = await postModel.findById(id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.user.toString() !== userId) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await post.deleteOne();
  await userModel.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });

  return res.status(200).json({ message: "Post deleted" });
};

// POST /api/posts/:id/like
export const likePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const post = await postModel.findByIdAndUpdate(
    id,
    { $addToSet: { likes: userId } },
    { new: true }
  ).populate("user", "username profilePic");

  if (!post) return res.status(404).json({ message: "Post not found" });

  // Notify post owner (not self-like)
  if (post.user._id.toString() !== userId.toString()) {
    await notificationModel.create({
      user: post.user._id,
      actor: userId,
      type: "like",
      referenceId: post._id,
    });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const socketId = onlineUsers.get(post.user._id.toString());
      if (socketId) {
        io.to(socketId).emit("notification", {
          type: "like",
          actor: { id: userId, username: req.user.username },
          postId: post._id,
        });
      }
    }
  }

  return res.status(200).json({ likes: post.likes, likesCount: post.likes.length });
};

// POST /api/posts/:id/unlike
export const unlikePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const post = await postModel.findByIdAndUpdate(
    id,
    { $pull: { likes: userId } },
    { new: true }
  );

  if (!post) return res.status(404).json({ message: "Post not found" });

  return res.status(200).json({ likes: post.likes, likesCount: post.likes.length });
};

// GET /api/posts/feed  — posts from following + self
export const getFeed = async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const currentUser = await userModel.findById(userId).select("following");
  const feedUserIds = [userId, ...currentUser.following];

  const posts = await postModel
    .find({ user: { $in: feedUserIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("user", "username profilePic");

  const total = await postModel.countDocuments({ user: { $in: feedUserIds } });

  return res.status(200).json({
    posts,
    hasMore: skip + posts.length < total,
    page,
  });
};

// POST /api/posts/:id/save
export const savePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  await userModel.findByIdAndUpdate(userId, { $addToSet: { savedPosts: id } });
  return res.status(200).json({ message: "Post saved" });
};

// POST /api/posts/:id/unsave
export const unsavePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  await userModel.findByIdAndUpdate(userId, { $pull: { savedPosts: id } });
  return res.status(200).json({ message: "Post unsaved" });
};

// GET /api/posts/saved
export const getSavedPosts = async (req, res) => {
  const userId = req.user._id;
  const user = await userModel.findById(userId).populate({
    path: "savedPosts",
    populate: { path: "user", select: "username profilePic" },
    options: { sort: { createdAt: -1 } },
  });

  return res.status(200).json({ posts: user.savedPosts });
};
