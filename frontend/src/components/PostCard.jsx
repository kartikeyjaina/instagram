import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { postService } from "../api/postService";
import { authService } from "../api/authService";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import CommentsModal from "./CommentsModal";
import Button from "./ui/Button";

function PostCard({ post, onDelete, onLikeChange, onSaveChange }) {
  const currentUser = authService.getUser();
  const currentUserId = currentUser?.id || currentUser?._id;

  const [likes, setLikes] = useState(post.likes || []);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [showComments, setShowComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const isLiked = likes.some(
    (id) =>
      (typeof id === "object" ? id._id || id : id).toString() ===
      currentUserId?.toString(),
  );
  const isOwner =
    post.user?._id?.toString() === currentUserId?.toString() ||
    post.user?.id?.toString() === currentUserId?.toString();

  const handleLike = async () => {
    try {
      if (isLiked) {
        const data = await postService.unlikePost(post._id);
        setLikes(data.likes);
        onLikeChange?.(post._id, data.likes);
      } else {
        setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 600);
        const data = await postService.likePost(post._id);
        setLikes(data.likes);
        onLikeChange?.(post._id, data.likes);
      }
    } catch {
      toast.error("Failed to update like");
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await postService.unsavePost(post._id);
        setSaved(false);
        toast.success("Post unsaved");
      } else {
        await postService.savePost(post._id);
        setSaved(true);
        toast.success("Post saved");
      }
      onSaveChange?.(post._id, !saved);
    } catch {
      toast.error("Failed to save post");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await postService.deletePost(post._id);
      toast.success("Post deleted");
      onDelete?.(post._id);
    } catch {
      toast.error("Failed to delete post");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="post-card"
      >
        <div className="post-header row-between">
          <Link to={`/profile/${post.user?._id}`} className="row-start">
            {post.user?.profilePic ? (
              <img src={post.user.profilePic} alt="" className="avatar" />
            ) : (
              <div className="avatar-fallback">
                {post.user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="field-label">@{post.user?.username}</p>
              <p className="field-note">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </Link>
          {isOwner && (
            <Button variant="ghost" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>

        <div className="post-media-wrap" onDoubleClick={handleLike}>
          <img
            src={post.imageUrl}
            alt={post.caption}
            className="post-media"
            loading="lazy"
          />
          <AnimatePresence>
            {likeAnim && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="post-like-overlay"
              >
                <span className="post-like-heart">❤</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="post-body">
          <div className="post-actions">
            <div className="row-start">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleLike}
                className="button-link"
              >
                <span>{isLiked ? "♥" : "♡"}</span>
                <span>{likes.length}</span>
              </motion.button>

              <Button variant="ghost" onClick={() => setShowComments(true)}>
                Comment
              </Button>
            </div>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" onClick={handleSave}>
                {saved ? "Saved" : "Save"}
              </Button>
            </motion.div>
          </div>

          {post.caption && (
            <p className="post-caption">
              <span className="field-label">@{post.user?.username}</span>{" "}
              {post.caption}
            </p>
          )}
        </div>
      </motion.div>

      {showComments && (
        <CommentsModal post={post} onClose={() => setShowComments(false)} />
      )}
    </>
  );
}

export default PostCard;
