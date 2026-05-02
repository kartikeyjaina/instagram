import { apiClient } from "./client";

export const notificationService = {
  getNotifications: async () => {
    const res = await apiClient.get("/notifications");
    return res.data.data.notifications;
  },
  markAsRead: async (id) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.patch("/notifications/read-all");
    return res.data.data;
  },
};
