import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { messageService } from "../api/messageService";
import { authService } from "../api/authService";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

function Messages() {
  const currentUser = authService.getUser();
  const currentUserId = currentUser?.id || currentUser?._id;

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Init socket
  useEffect(() => {
    const socket = io("http://localhost:4000", {
      query: { userId: currentUserId },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("receive_message", (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
    });

    socket.on("typing", ({ senderId }) => {
      if (senderId === selectedUser?._id) setIsTyping(true);
    });

    socket.on("stop_typing", ({ senderId }) => {
      if (senderId === selectedUser?._id) setIsTyping(false);
    });

    return () => socket.disconnect();
  }, [currentUserId, selectedUser?._id]);

  useEffect(() => {
    messageService.getConversations()
      .then(setConversations)
      .catch(() => toast.error("Failed to load conversations"))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMsgs(true);
    messageService.getConversation(selectedUser._id)
      .then(setMessages)
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoadingMsgs(false));
  }, [selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;
    socketRef.current?.emit("send_message", {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      text: text.trim(),
    });
    setText("");
    socketRef.current?.emit("stop_typing", { receiverId: selectedUser._id, senderId: currentUserId });
  };

  const handleTyping = (val) => {
    setText(val);
    if (!selectedUser) return;
    socketRef.current?.emit("typing", { receiverId: selectedUser._id, senderId: currentUserId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { receiverId: selectedUser._id, senderId: currentUserId });
    }, 1500);
  };

  return (
    <div className="min-h-screen pt-16 flex" style={{ height: "100vh" }}>
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col" style={{ background: "rgba(10,14,39,0.95)" }}>
        <div className="p-4 border-b border-white/10">
          <h2 className="gradient-text font-black text-lg">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-2 w-32 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-gray-500 text-sm text-center p-6">No conversations yet</p>
          ) : (
            conversations.map(({ user, lastMessage, unreadCount }) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                  selectedUser?._id === user._id ? "bg-cyan-400/10 border-r-2 border-cyan-400" : "hover:bg-white/5"
                }`}
              >
                {user.profilePic ? (
                  <img src={user.profilePic} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-semibold text-sm truncate">@{user.username}</p>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 bg-cyan-400 rounded-full text-xs flex items-center justify-center text-black font-bold flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-gray-500 text-xs truncate">{lastMessage.text}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-white font-bold text-lg">Select a conversation</p>
              <p className="text-gray-500 text-sm">Choose someone to message</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3" style={{ background: "rgba(10,14,39,0.95)" }}>
              {selectedUser.profilePic ? (
                <img src={selectedUser.profilePic} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-bold">@{selectedUser.username}</p>
                {isTyping && <p className="text-cyan-400 text-xs animate-pulse">typing...</p>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center pt-8"><div className="spinner" /></div>
              ) : messages.length === 0 ? (
                <p className="text-gray-500 text-center pt-8 text-sm">Start the conversation!</p>
              ) : (
                messages.map((msg) => {
                  const isMine = (msg.sender?._id || msg.sender) === currentUserId ||
                    msg.sender?._id?.toString() === currentUserId?.toString();
                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMine
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-sm"
                          : "bg-white/10 text-gray-200 rounded-bl-sm"
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1 ${isMine ? "text-white/60" : "text-gray-500"}`}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-3" style={{ background: "rgba(10,14,39,0.95)" }}>
              <input
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type a message..."
                className="input-field flex-1"
                maxLength={2000}
              />
              <button type="submit" disabled={!text.trim()} className="btn-primary px-5">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;
