import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { postService } from "../api/postService";
import { authService } from "../api/authService";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import CommentsModal from "./CommentsModal";

function PostCard({ post, onDelete, onLikeChange, onSaveChange }) {
  const currentUser = authService.getUser();
  const currentUserId = currentUser?.id || currentUser?._id;

  const [likes, setLikes] = useState(post.likes || []);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [showComments, setShowComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const isLiked = likes.some((id) =>
    (typeof id === "object" ? id._id || id : id).toString() === currentUserId?.toString()
  );
  const isOwner = post.user?._id?.toString() === currentUserId?.toString() ||
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
        className="glass-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link to={`/profile/${post.user?._id}`} className="flex items-center gap-3 group">
            {post.user?.profilePic ? (
              <img src={post.user.profilePic} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-cyan-400/30 group-hover:ring-cyan-400/60 transition-all" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {post.user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-sm group-hover:text-cyan-400 transition-colors">
                @{post.user?.username}
              </p>
              <p className="text-gray-500 text-xs">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </Link>
          {isOwner && (
            <button onClick={handleDelete} className="text-gray-600 hover:text-red-400 transition-colors text-lg p-1">
              🗑️
            </button>
          )}
        </div>

        {/* Image */}
        <div className="relative group cursor-pointer" onDoubleClick={handleLike}>
          <img
            src={post.imageUrl}
            alt={post.caption}
            className="w-full object-cover max-h-[500px]"
            loading="lazy"
          />
          <AnimatePresence>
            {likeAnim && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <span className="text-6xl drop-shadow-lg">❤️</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isLiked ? "text-red-400" : "text-gray-400 hover:text-red-400"}`}
              >
                <span className="text-lg">{isLiked ? "❤️" : "🤍"}</span>
                <span>{likes.length}</span>
              </motion.button>

              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <span className="text-lg">💬</span>
                <span>Comment</span>
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleSave}
              className={`text-lg transition-colors ${saved ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
            >
              {saved ? "🔖" : "🏷️"}
            </motion.button>
          </div>

          {post.caption && (
            <p className="text-gray-300 text-sm leading-relaxed">
              <span className="text-white font-semibold">@{post.user?.username}</span>{" "}
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
