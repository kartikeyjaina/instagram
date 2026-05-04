import { apiClient } from "./client";

export const aiService = {
  generateCaption: async (context) => {
    const res = await apiClient.post("/ai/generate-caption", { context });
    return res.data.data.suggestions;
  },
  generateCommentReply: async ({ commentText, postCaption, commenterName }) => {
    const res = await apiClient.post("/ai/generate-comment-reply", {
      commentText,
      postCaption,
      commenterName,
    });
    return res.data.data.suggestion;
  },
};
