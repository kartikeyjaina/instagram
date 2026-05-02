import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { postService } from "../api/postService";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import toast from "react-hot-toast";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  const loadPosts = useCallback(async (pageNum, replace = false) => {
    try {
      const data = await postService.getFeed(pageNum);
      setPosts((prev) => replace ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore);
    } catch {
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1, true);
  }, [loadPosts]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage);
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, loadPosts]);

  const handleDelete = (postId) => setPosts((prev) => prev.filter((p) => p._id !== postId));
  const handleLikeChange = (postId, newLikes) =>
    setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, likes: newLikes } : p));

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-text text-2xl font-black mb-6"
        >
          Your Feed
        </motion.h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-4xl mb-4">🌐</p>
            <p className="text-white font-bold text-lg mb-2">Your feed is empty</p>
            <p className="text-gray-400 text-sm">Follow people to see their posts here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handleDelete}
                onLikeChange={handleLikeChange}
              />
            ))}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="spinner" />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-gray-600 text-sm py-4">You're all caught up ✓</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Feed;
