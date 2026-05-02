import { notificationModel } from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  const notifications = await notificationModel
    .find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor", "username profilePic");

  res.status(200).json({ success: true, data: { notifications } });
};

export const markAsRead = async (req, res) => {
  const notification = await notificationModel.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) return res.status(404).json({ success: false, error: "Notification not found" });

  res.status(200).json({ success: true, data: { notification } });
};

export const markAllAsRead = async (req, res) => {
  await notificationModel.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, data: { message: "All notifications marked as read" } });
};
