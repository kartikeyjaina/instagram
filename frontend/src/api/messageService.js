import { apiClient } from "./client";

export const messageService = {
  getConversations: async () => {
    const res = await apiClient.get("/messages/conversations");
    return res.data?.data?.conversations ?? [];
  },
  getConversation: async (userId) => {
    const res = await apiClient.get(`/messages/${userId}`);
    return res.data?.data?.messages ?? [];
  },
  sendMessage: async (receiverId, text) => {
    const res = await apiClient.post(`/messages`, { receiverId, text });
    // controller responds with { success: true, data: { message } }
    return res.data?.data?.message;
  },
};
