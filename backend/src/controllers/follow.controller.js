import { userModel } from "../models/user.model.js";
import { followModel } from "../models/follow.model.js";
import { notificationModel } from "../models/notification.model.js";

export const followUser = async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.user._id.toString();

  if (targetId === currentId) {
    return res
      .status(400)
      .json({ success: false, error: "You cannot follow yourself" });
  }

  const target = await userModel.findById(targetId);
  if (!target)
    return res.status(404).json({ success: false, error: "User not found" });

  const existingFollow = await followModel.findOne({
    follower: currentId,
    following: targetId,
  });
  if (existingFollow) {
    return res
      .status(400)
      .json({ success: false, error: "Already following this user" });
  }

  const current = await userModel.findById(currentId);

  await Promise.all([
    followModel.create({ follower: currentId, following: targetId }),
    userModel.findByIdAndUpdate(currentId, { $inc: { followingCount: 1 } }),
    userModel.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } }),
  ]);

  await notificationModel.create({
    user: targetId,
    actor: currentId,
    type: "follow",
  });

  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  if (io && onlineUsers) {
    const targetSocketId = onlineUsers.get(targetId?.toString?.() || targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("notification", {
        type: "follow",
        actor: {
          id: current._id,
          username: current.username,
          profilePic: current.profilePic,
        },
      });
    }
  }

  res
    .status(200)
    .json({ success: true, data: { message: "Followed successfully" } });
};

export const unfollowUser = async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.user._id.toString();

  if (targetId === currentId) {
    return res
      .status(400)
      .json({ success: false, error: "You cannot unfollow yourself" });
  }

  const target = await userModel.findById(targetId);
  if (!target)
    return res.status(404).json({ success: false, error: "User not found" });

  await Promise.all([
    followModel.deleteOne({ follower: currentId, following: targetId }),
    userModel.findByIdAndUpdate(currentId, {
      $inc: { followingCount: -1 },
      $min: { followingCount: 0 },
    }),
    userModel.findByIdAndUpdate(targetId, {
      $inc: { followersCount: -1 },
      $min: { followersCount: 0 },
    }),
  ]);

  res
    .status(200)
    .json({ success: true, data: { message: "Unfollowed successfully" } });
};

export const checkIsFollowing = async (currentUserId, targetId) => {
  const follow = await followModel.findOne({
    follower: currentUserId,
    following: targetId,
  });
  return !!follow;
};

export const batchCheckIsFollowing = async (currentUserId, targetIds) => {
  const follows = await followModel.find({
    follower: currentUserId,
    following: { $in: targetIds },
  });
  const followingSet = new Set(follows.map((f) => f.following.toString()));
  return targetIds.map((id) => followingSet.has(id.toString()));
};

export const getFollowers = async (userId, limit = 20, skip = 0) => {
  return await followModel
    .find({ following: userId })
    .select("follower")
    .populate("follower", "username profilePic bio")
    .limit(limit)
    .skip(skip);
};

export const getFollowing = async (userId, limit = 20, skip = 0) => {
  return await followModel
    .find({ follower: userId })
    .select("following")
    .populate("following", "username profilePic bio")
    .limit(limit)
    .skip(skip);
};
