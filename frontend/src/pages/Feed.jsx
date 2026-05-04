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
      setPosts((prev) => (replace ? data.posts : [...prev, ...data.posts]));
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
      { threshold: 0.1 },
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, loadPosts]);

  const handleDelete = (postId) =>
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  const handleLikeChange = (postId, newLikes) =>
    setPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, likes: newLikes } : p)),
    );

  return (
    <div className="layout-container-narrow page-stack">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-heading">Feed</h1>
        <p className="page-subtitle">
          Recent activity from the people you follow.
        </p>
      </motion.div>

      {loading ? (
        <div className="post-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🌐</p>
          <h2 className="empty-title">Your feed is empty</h2>
          <p className="empty-copy">Follow people to see their posts here.</p>
        </div>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handleDelete}
              onLikeChange={handleLikeChange}
            />
          ))}
          <div ref={sentinelRef} />
          {loadingMore && (
            <div className="row-start justify-center">
              <div className="spinner" />
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="empty-copy text-center">You're all caught up.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Feed;
