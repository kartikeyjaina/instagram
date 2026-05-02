import { apiClient } from "./client";

export const profileService = {
  getProfile: async (userId) => {
    const res = await apiClient.get(`/users/${userId}`);
    return res.data.data.user;
  },
  updateProfile: async ({ username, bio, profilePic }) => {
    const res = await apiClient.put("/users/update", { username, bio, profilePic });
    return res.data.data.user;
  },
  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
};
