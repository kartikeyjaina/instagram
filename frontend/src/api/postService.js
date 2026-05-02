import { apiClient } from "./client";

export const postService = {
  createPost: async (formData) => {
    const res = await apiClient.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.post;
  },
  getFeed: async (page = 1) => {
    const res = await apiClient.get(`/posts/feed?page=${page}&limit=10`);
    return res.data;
  },
  getAllPosts: async (page = 1) => {
    const res = await apiClient.get(`/posts?page=${page}&limit=10`);
    return res.data;
  },
  getUserPosts: async (userId, page = 1) => {
    const res = await apiClient.get(`/posts/user/${userId}?page=${page}&limit=12`);
    return res.data;
  },
  deletePost: async (postId) => {
    const res = await apiClient.delete(`/posts/${postId}`);
    return res.data;
  },
  likePost: async (postId) => {
    const res = await apiClient.post(`/posts/${postId}/like`);
    return res.data;
  },
  unlikePost: async (postId) => {
    const res = await apiClient.post(`/posts/${postId}/unlike`);
    return res.data;
  },
  savePost: async (postId) => {
    const res = await apiClient.post(`/posts/${postId}/save`);
    return res.data;
  },
  unsavePost: async (postId) => {
    const res = await apiClient.post(`/posts/${postId}/unsave`);
    return res.data;
  },
  getSavedPosts: async () => {
    const res = await apiClient.get("/posts/saved");
    return res.data.posts;
  },
};
