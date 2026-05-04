import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aiService } from "../api/aiService";
import { commentService } from "../api/commentService";
import { authService } from "../api/authService";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import Button from "./ui/Button";
import Input from "./ui/Input";

function CommentsModal({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyGeneratingFor, setReplyGeneratingFor] = useState(null);
  const bottomRef = useRef(null);
  const currentUser = authService.getUser();

  useEffect(() => {
    commentService
      .getComments(post._id)
      .then(setComments)
      .catch(() => toast.error("Failed to load comments"))
      .finally(() => setLoading(false));
  }, [post._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (replyTarget) {
        const aiReply = await commentService.createAiReply(
          post._id,
          text.trim(),
          replyTarget._id,
        );
        setComments((prev) => [...prev, aiReply]);
      } else {
        const { comment } = await commentService.createComment(post._id, text.trim());
        setComments((prev) => [...prev, comment]);
      }
      setText("");
      setReplyTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggestReply = async (comment) => {
    if (replyGeneratingFor) return;

    setReplyGeneratingFor(comment._id);
    try {
      const suggestion = await aiService.generateCommentReply({
        commentText: comment.text,
        postCaption: post.caption,
        commenterName: comment.user?.username,
      });

      setReplyTarget(comment);
      setText(suggestion);
      toast.success("AI reply ready");
    } catch {
      toast.error("Failed to generate AI reply");
    } finally {
      setReplyGeneratingFor(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="modal-card"
        >
          <div className="modal-header row-between">
            <h3 className="section-heading">Comments</h3>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="modal-body row-between comment-preview">
            <img src={post.imageUrl} alt="" className="avatar avatar-md" />
            <div>
              <p className="field-label">@{post.user?.username}</p>
              <p className="field-note">{post.caption || "No caption"}</p>
            </div>
          </div>

          <div className="message-list comment-list-surface">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="row-start comment-row">
                  <div className="skeleton avatar avatar-sm" />
                  <div className="stack-xs flex-1">
                    <div className="skeleton skeleton-h-12 skeleton-w-96" />
                    <div className="skeleton skeleton-h-12 skeleton-w-100" />
                  </div>
                </div>
              ))
            ) : comments.length === 0 ? (
              <p className="empty-copy comment-empty">
                No comments yet. Be the first.
              </p>
            ) : (
              comments.map((c) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="row-start comment-row"
                >
                  {c.user?.profilePic ? (
                    <img
                      src={c.user.profilePic}
                      alt=""
                      className="avatar avatar-sm"
                    />
                  ) : (
                    <div className="avatar-fallback avatar-sm avatar-fallback-xs">
                      {c.isAI
                        ? "🤖"
                        : c.user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="comment-meta">
                    <div className="comment-meta-head">
                      <span className="field-label">
                        {c.isAI ? "Nexus AI" : `@${c.user?.username}`}
                      </span>
                      {c.isAI && <span className="field-note">AI</span>}
                      {c.replyTo?.user && (
                        <span className="field-note">
                          Reply to @{c.replyTo.user.username}
                        </span>
                      )}
                      <span className="field-note">
                        {formatDistanceToNow(new Date(c.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                    {!c.isAI && (
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => handleSuggestReply(c)}
                        disabled={replyGeneratingFor === c._id}
                        className="mt-2 px-0"
                      >
                        {replyGeneratingFor === c._id
                          ? "Thinking..."
                          : "AI reply"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {replyTarget && (
            <div className="modal-body row-between comment-preview">
              <div>
                <p className="field-label">
                  Replying to @{replyTarget.user?.username}
                </p>
                <p className="field-note">
                  AI reply will be posted as a comment
                </p>
              </div>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setReplyTarget(null);
                  setText("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="message-composer row-between"
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                replyTarget
                  ? "Edit and send this AI-drafted reply"
                  : "Add a comment..."
              }
              className=""
              maxLength={1000}
              disabled={submitting}
            />
            <Button type="submit" disabled={!text.trim() || submitting}>
              {submitting ? (
                <div className="spinner" />
              ) : replyTarget ? (
                "Send AI reply"
              ) : (
                "Post"
              )}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommentsModal;
