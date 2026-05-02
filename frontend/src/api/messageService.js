import { apiClient } from "./client";

export const messageService = {
  getConversations: async () => {
    const res = await apiClient.get("/messages/conversations");
    return res.data.conversations;
  },
  getConversation: async (userId) => {
    const res = await apiClient.get(`/messages/${userId}`);
    return res.data.messages;
  },
};
