import { apiClient } from "./client";

export const followService = {
  follow: async (userId) => {
    const res = await apiClient.post(`/users/${userId}/follow`);
    return res.data.data;
  },
  unfollow: async (userId) => {
    const res = await apiClient.post(`/users/${userId}/unfollow`);
    return res.data.data;
  },
  searchUsers: async (q) => {
    const res = await apiClient.get(`/users/search?q=${encodeURIComponent(q)}`);
    return res.data.data.users;
  },
};
