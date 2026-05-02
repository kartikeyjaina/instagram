import { notificationModel } from "../models/notification.model.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
  const userId = req.user._id;

  const notifications = await notificationModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor", "username profilePic");

  return res.status(200).json({ notifications });
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await notificationModel.findOneAndUpdate(
    { _id: id, user: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: "Notification not found" });

  return res.status(200).json({ notification });
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  await notificationModel.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );
  return res.status(200).json({ message: "All notifications marked as read" });
};
