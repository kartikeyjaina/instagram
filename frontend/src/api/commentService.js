import { apiClient } from "./client";

export const commentService = {
  getComments: async (postId) => {
    const res = await apiClient.get(`/comments/${postId}`);
    return res.data.data.comments;
  },
  createComment: async (postId, text) => {
    const res = await apiClient.post("/comments", { postId, text });
    return res.data.data;
  },
};
