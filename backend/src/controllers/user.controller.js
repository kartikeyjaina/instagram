import { userModel } from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user?._id?.toString();

  const user = await userModel.findById(id).select("-passwordHash");
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  const isFollowing = currentUserId
    ? user.followers.some((fid) => fid.toString() === currentUserId)
    : false;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePic: user.profilePic,
        postsCount: user.postsCount,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        createdAt: user.createdAt,
      },
    },
  });
};

export const updateUserProfile = async (req, res) => {
  const authUserId = req.user._id.toString();
  const { username, bio, profilePic } = req.body;
  const updates = {};

  if (username !== undefined) {
    const trimmed = username.trim();
    if (trimmed.length < 3) return res.status(400).json({ success: false, error: "Username must be at least 3 characters" });
    if (trimmed.length > 30) return res.status(400).json({ success: false, error: "Username cannot exceed 30 characters" });
    updates.username = trimmed;
  }

  if (bio !== undefined) {
    const trimmed = bio.trim();
    if (trimmed.length > 200) return res.status(400).json({ success: false, error: "Bio cannot exceed 200 characters" });
    updates.bio = trimmed;
  }

  if (profilePic !== undefined) {
    try { new URL(profilePic); } catch {
      return res.status(400).json({ success: false, error: "profilePic must be a valid URL" });
    }
    updates.profilePic = profilePic;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: "No valid fields provided for update" });
  }

  if (updates.username) {
    const taken = await userModel.findOne({ username: updates.username, _id: { $ne: authUserId } });
    if (taken) return res.status(409).json({ success: false, error: "Username is already taken" });
  }

  const updatedUser = await userModel
    .findByIdAndUpdate(authUserId, { $set: updates }, { new: true, runValidators: true })
    .select("-passwordHash");

  if (!updatedUser) return res.status(404).json({ success: false, error: "User not found" });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        profilePic: updatedUser.profilePic,
        postsCount: updatedUser.postsCount,
        followersCount: updatedUser.followers.length,
        followingCount: updatedUser.following.length,
      },
    },
  });
};

export const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) return res.status(400).json({ success: false, error: "Query is required" });

  const users = await userModel
    .find({ username: { $regex: q.trim(), $options: "i" } })
    .select("username profilePic bio")
    .limit(20);

  res.status(200).json({ success: true, data: { users } });
};
