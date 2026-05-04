import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { messageService } from "../api/messageService";
import { authService } from "../api/authService";
import { profileService } from "../api/profileService";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

function Messages() {
  const [searchParams] = useSearchParams();
  const currentUser = authService.getUser();
  const currentUserId = currentUser?.id || currentUser?._id;
  const directUserId = searchParams.get("user");

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
  const selectedUserId = selectedUser?._id || selectedUser?.id;

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
      if (senderId === selectedUserId) setIsTyping(true);
    });

    socket.on("stop_typing", ({ senderId }) => {
      if (senderId === selectedUserId) setIsTyping(false);
    });

    return () => socket.disconnect();
  }, [currentUserId, selectedUserId]);

  useEffect(() => {
    messageService
      .getConversations()
      .then((data) => {
        if (Array.isArray(data)) {
          setConversations(data);
        } else if (Array.isArray(data?.conversations)) {
          setConversations(data.conversations);
        } else if (Array.isArray(data?.data)) {
          setConversations(data.data);
        } else {
          setConversations([]);
        }
      })
      .catch(() => toast.error("Failed to load conversations"))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    setLoadingMsgs(true);
    messageService
      .getConversation(selectedUserId)
      .then((data) => setMessages(data || []))
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoadingMsgs(false));
  }, [selectedUser, selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!directUserId) return;

    const existingConversation = conversations.find(
      (conversation) => conversation?.user?._id === directUserId,
    );

    if (existingConversation?.user) {
      setSelectedUser(existingConversation.user);
      return;
    }

    let active = true;

    profileService
      .getProfile(directUserId)
      .then((user) => {
        if (active && user) {
          setSelectedUser(user);
        }
      })
      .catch(() => toast.error("Could not open that conversation"));

    return () => {
      active = false;
    };
  }, [directUserId, conversations]);

  console.log("conversations:", conversations);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;

    const payloadText = text.trim();
    setText("");

    // Send via API; server will persist and emit over sockets to recipients
    messageService
      .sendMessage(selectedUserId, payloadText)
      .then((msg) => {
        if (!msg) return;
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          return exists ? prev : [...prev, msg];
        });
      })
      .catch((err) => {
        // If API route is missing, fallback to socket emit (server socket persists too)
        if (err?.response?.status === 404) {
          console.warn(
            "API /messages returned 404, falling back to socket.emit",
          );
          socketRef.current?.emit("send_message", {
            senderId: currentUserId,
            receiverId: selectedUserId,
            text: payloadText,
          });
          return;
        }

        toast.error("Failed to send message");
      });

    // UX: notify recipient we're done typing
    socketRef.current?.emit("stop_typing", {
      receiverId: selectedUserId,
      senderId: currentUserId,
    });
  };

  const handleTyping = (value) => {
    setText(value);
    if (!selectedUser) return;

    socketRef.current?.emit("typing", {
      receiverId: selectedUserId,
      senderId: currentUserId,
    });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", {
        receiverId: selectedUserId,
        senderId: currentUserId,
      });
    }, 1500);
  };

  return (
    <div className="layout-container-wide">
      <div className="sidebar-layout">
        <aside className="message-sidebar">
          <div className="message-header">
            <h2 className="section-heading">Messages</h2>
          </div>
          <div className="message-list">
            {loadingConvs ? (
              <div className="stack-sm">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="row-start comment-row">
                    <div className="skeleton avatar avatar-sm" />
                    <div className="stack-xs flex-1">
                      <div className="skeleton skeleton-h-12 skeleton-w-96" />
                      <div className="skeleton skeleton-h-10 skeleton-w-72" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !Array.isArray(conversations) || conversations.length === 0 ? (
              <p className="empty-copy">No conversations yet</p>
            ) : (
              Array.isArray(conversations) &&
              conversations.map(({ user, lastMessage, unreadCount }) => {
                if (!user) return null;

                return (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`conversation-item ${selectedUser?._id === user._id ? "conversation-item-active" : ""}`}
                  >
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt=""
                        className="avatar avatar-sm"
                      />
                    ) : (
                      <div className="avatar-fallback avatar-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="comment-meta">
                      <div className="row-between">
                        <p className="field-label">@{user.username}</p>
                        {unreadCount > 0 && (
                          <span className="field-note">{unreadCount}</span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="field-note message-preview">
                          {lastMessage.text}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="message-main surface-card">
          {!selectedUser ? (
            <div className="chat-empty">
              <div className="empty-state">
                <p className="empty-icon">💬</p>
                <h3 className="empty-title">Select a conversation</h3>
                <p className="empty-copy">Choose someone to message.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="message-header row-start">
                {selectedUser.profilePic ? (
                  <img
                    src={selectedUser.profilePic}
                    alt=""
                    className="avatar avatar-sm"
                  />
                ) : (
                  <div className="avatar-fallback avatar-sm">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="field-label">@{selectedUser.username}</p>
                  {isTyping && <p className="field-note">typing...</p>}
                </div>
              </div>

              <div className="message-list">
                {loadingMsgs ? (
                  <div className="row-start justify-center">
                    <div className="spinner" />
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <p className="empty-copy text-center">
                    Start the conversation.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMine =
                      (msg.sender?._id || msg.sender) === currentUserId ||
                      msg.sender?._id?.toString() === currentUserId?.toString();

                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`row-start ${isMine ? "message-row-end" : ""}`}
                      >
                        <div
                          className={`message-bubble ${isMine ? "message-bubble-me" : ""}`}
                        >
                          <p className="post-caption">{msg.text}</p>
                          <p className="field-note">
                            {formatDistanceToNow(new Date(msg.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="message-composer row-between"
              >
                <Input
                  value={text}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                />
                <Button type="submit" disabled={!text.trim()}>
                  Send
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Messages;
