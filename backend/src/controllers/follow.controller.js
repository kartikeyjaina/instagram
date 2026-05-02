import { userModel } from "../models/user.model.js";
import { notificationModel } from "../models/notification.model.js";

// POST /api/users/:id/follow
export const followUser = async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.user._id.toString();

  if (targetId === currentId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const [target, current] = await Promise.all([
    userModel.findById(targetId),
    userModel.findById(currentId),
  ]);

  if (!target) return res.status(404).json({ message: "User not found" });

  const alreadyFollowing = current.following.some(
    (id) => id.toString() === targetId
  );
  if (alreadyFollowing) {
    return res.status(400).json({ message: "Already following this user" });
  }

  await Promise.all([
    userModel.findByIdAndUpdate(currentId, { $addToSet: { following: targetId } }),
    userModel.findByIdAndUpdate(targetId, { $addToSet: { followers: currentId } }),
  ]);

  // Create notification
  await notificationModel.create({
    user: targetId,
    actor: currentId,
    type: "follow",
  });

  // Emit real-time notification if socket map available
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

  return res.status(200).json({ message: "Followed successfully" });
};

// POST /api/users/:id/unfollow
export const unfollowUser = async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.user._id.toString();

  if (targetId === currentId) {
    return res.status(400).json({ message: "You cannot unfollow yourself" });
  }

  const target = await userModel.findById(targetId);
  if (!target) return res.status(404).json({ message: "User not found" });

  await Promise.all([
    userModel.findByIdAndUpdate(currentId, { $pull: { following: targetId } }),
    userModel.findByIdAndUpdate(targetId, { $pull: { followers: currentId } }),
  ]);

  return res.status(200).json({ message: "Unfollowed successfully" });
};
