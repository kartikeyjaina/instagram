import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { postService } from "../api/postService";
import { followService } from "../api/followService";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function Explore() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const searchTimeout = useRef(null);

  const loadPosts = useCallback(async (pageNum, replace = false) => {
    try {
      const data = await postService.getAllPosts(pageNum);
      setPosts((prev) => replace ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPosts(1, true); }, [loadPosts]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoadingMore(true);
        const next = page + 1;
        setPage(next);
        loadPosts(next);
      }
    }, { threshold: 0.1 });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, loadPosts]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await followService.searchUsers(q);
        setSearchResults(users);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const handleDelete = (postId) => setPosts((prev) => prev.filter((p) => p._id !== postId));
  const handleLikeChange = (postId, newLikes) =>
    setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, likes: newLikes } : p));

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="gradient-text text-2xl font-black mb-6">
          Explore
        </motion.h1>

        {/* Search */}
        <div className="relative mb-6">
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="🔍 Search users..."
            className="input-field w-full"
          />
          {(searching || searchResults.length > 0) && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card z-10 overflow-hidden">
              {searching ? (
                <div className="p-4 flex justify-center"><div className="spinner" /></div>
              ) : searchResults.length === 0 ? (
                <p className="p-4 text-gray-500 text-sm text-center">No users found</p>
              ) : (
                searchResults.map((user) => (
                  <Link
                    key={user._id}
                    to={`/profile/${user._id}`}
                    onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                  >
                    {user.profilePic ? (
                      <img src={user.profilePic} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">@{user.username}</p>
                      {user.bio && <p className="text-gray-500 text-xs line-clamp-1">{user.bio}</p>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDelete} onLikeChange={handleLikeChange} />
            ))}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && <div className="flex justify-center py-4"><div className="spinner" /></div>}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-gray-600 text-sm py-4">All posts loaded ✓</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
