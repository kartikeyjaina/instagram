import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { commentService } from "../api/commentService";
import { authService } from "../api/authService";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

function CommentsModal({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const bottomRef = useRef(null);
  const currentUser = authService.getUser();

  useEffect(() => {
    commentService.getComments(post._id)
      .then(setComments)
      .catch(() => toast.error("Failed to load comments"))
      .finally(() => setLoading(false));
  }, [post._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { comment, aiComment, aiCooldown } = await commentService.createComment(post._id, text.trim());
      setComments((prev) => {
        const updated = [...prev, comment];
        if (aiComment) updated.push(aiComment);
        return updated;
      });
      setText("");
      if (aiCooldown) {
        setCooldown(aiCooldown);
        toast("AI cooldown active", { icon: "⏳" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card w-full max-w-lg flex flex-col"
          style={{ maxHeight: "85vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-white font-bold text-lg">Comments</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl transition-colors">✕</button>
          </div>

          {/* Post preview */}
          <div className="p-4 border-b border-white/10 flex gap-3">
            <img src={post.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />
            <div>
              <p className="text-white font-semibold text-sm">@{post.user?.username}</p>
              <p className="text-gray-400 text-sm line-clamp-2">{post.caption || "No caption"}</p>
            </div>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                  </div>
                </div>
              ))
            ) : comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first!</p>
            ) : (
              comments.map((c) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex gap-3 ${c.isAI ? "bg-cyan-400/5 rounded-xl p-2 border border-cyan-400/20" : ""}`}
                >
                  {c.user?.profilePic ? (
                    <img src={c.user.profilePic} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.isAI ? "🤖" : c.user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">
                        {c.isAI ? "Nexus AI" : `@${c.user?.username}`}
                      </span>
                      {c.isAI && (
                        <span className="text-xs bg-cyan-400/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">AI</span>
                      )}
                      <span className="text-gray-600 text-xs">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-0.5 break-words">{c.text}</p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={cooldown > 0 ? `AI cooldown: ${cooldown}s` : "Add a comment… (use @ai to ask AI)"}
              className="input-field flex-1 text-sm"
              maxLength={1000}
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="btn-primary px-4 py-2 text-sm"
            >
              {submitting ? <div className="spinner" /> : "Post"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommentsModal;
