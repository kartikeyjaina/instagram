import { userModel } from "../models/user.model.js";
import { notificationModel } from "../models/notification.model.js";

export const followUser = async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.user._id.toString();

  if (targetId === currentId) {
    return res.status(400).json({ success: false, error: "You cannot follow yourself" });
  }

  const [target, current] = await Promise.all([
    userModel.findById(targetId),
    userModel.findById(currentId),
  ]);

  if (!target) return res.status(404).json({ success: false, error: "User not found" });

  const alreadyFollowing = current.following.some((id) => id.toString() === targetId);
  if (alreadyFollowing) {
    return res.status(400).json({ success: false, error: "Already following this user" });
  }

  await Promise.all([
    userModel.findByIdAndUpdate(currentId, { $addToSet: { following: targetId } }),
    userModel.findByIdAndUpdate(targetId, { $addToSet: { followers: currentId } }),
  ]);

  await notificationModel.create({ user: targetId, actor: currentId, type: "follow" });

  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  if (io && onlineUsers) {
    const targetSocketId = onlineUsers.get(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("notification", {
        type: "follow",
        actor: { id: current._id, username: current.username, profilePic: current.profilePic },
      });
    }
  }

  res.status(200).json({ success: true, data: { message: "Followed successfully" } });
};

export const unfollowUser = async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.user._id.toString();

  if (targetId === currentId) {
    return res.status(400).json({ success: false, error: "You cannot unfollow yourself" });
  }

  const target = await userModel.findById(targetId);
  if (!target) return res.status(404).json({ success: false, error: "User not found" });

  await Promise.all([
    userModel.findByIdAndUpdate(currentId, { $pull: { following: targetId } }),
    userModel.findByIdAndUpdate(targetId, { $pull: { followers: currentId } }),
  ]);

  res.status(200).json({ success: true, data: { message: "Unfollowed successfully" } });
};
