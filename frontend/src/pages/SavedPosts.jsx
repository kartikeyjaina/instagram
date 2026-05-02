import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { postService } from "../api/postService";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import toast from "react-hot-toast";

function SavedPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postService.getSavedPosts()
      .then((data) => setPosts(data.map((p) => ({ ...p, isSaved: true }))))
      .catch(() => toast.error("Failed to load saved posts"))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = (postId) => setPosts((prev) => prev.filter((p) => p._id !== postId));

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="gradient-text text-2xl font-black mb-6">
          Saved Posts
        </motion.h1>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <PostSkeleton key={i} />)}</div>
        ) : posts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-3">🔖</p>
            <p className="text-white font-bold">No saved posts</p>
            <p className="text-gray-500 text-sm mt-1">Tap the bookmark icon on any post to save it</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onSaveChange={(postId, saved) => { if (!saved) handleUnsave(postId); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedPosts;
