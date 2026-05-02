import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { notificationService } from "../api/notificationService";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const TYPE_CONFIG = {
  follow: { icon: "👤", label: "followed you" },
  like: { icon: "❤️", label: "liked your post" },
  comment: { icon: "💬", label: "commented on your post" },
  ai_reply: { icon: "🤖", label: "AI replied to a comment on your post" },
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.getNotifications()
      .then(setNotifications)
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="gradient-text text-2xl font-black">
            Notifications {unreadCount > 0 && <span className="text-lg">({unreadCount})</span>}
          </motion.h1>
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} className="btn-ghost text-sm px-3 py-1.5">Mark all read</button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card p-4 flex gap-3">
                <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-48 rounded" />
                  <div className="skeleton h-2 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-white font-bold">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-1">Activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type] || { icon: "📢", label: "activity" };
              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => !notif.isRead && handleMarkOne(notif._id)}
                  className={`glass-card p-4 flex items-center gap-3 cursor-pointer transition-all ${
                    !notif.isRead ? "border-cyan-400/30 bg-cyan-400/5" : "opacity-70"
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">
                      <Link to={`/profile/${notif.actor?._id}`} className="font-bold hover:text-cyan-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                        @{notif.actor?.username}
                      </Link>{" "}
                      <span className="text-gray-300">{config.label}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
