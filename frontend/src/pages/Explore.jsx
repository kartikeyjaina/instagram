import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { postService } from "../api/postService";
import { followService } from "../api/followService";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

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
      setPosts((prev) => (replace ? data.posts : [...prev, ...data.posts]));
      setHasMore(data.hasMore);
    } catch {
      toast.error("Failed to load posts");
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
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          const next = page + 1;
          setPage(next);
          loadPosts(next);
        }
      },
      { threshold: 0.1 },
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, page, loadPosts]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await followService.searchUsers(value);
        setSearchResults(users);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleDelete = (postId) =>
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  const handleLikeChange = (postId, newLikes) =>
    setPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, likes: newLikes } : p)),
    );

  return (
    <div className="layout-container-narrow page-stack">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-heading">Explore</h1>
        <p className="page-subtitle">Search people and browse public posts.</p>
      </motion.div>

      <div className="search-panel">
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users..."
        />
        {(searching || searchResults.length > 0) && searchQuery && (
          <div className="search-results surface-card">
            {searching ? (
              <div className="row-start justify-center">
                <div className="spinner" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="empty-copy text-center">No users found</p>
            ) : (
              searchResults.map((user) => (
                <div key={user._id} className="search-result row-between">
                  <Link
                    to={`/profile/${user._id}`}
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="row-start flex-1"
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
                    <div>
                      <p className="field-label">@{user.username}</p>
                      {user.bio && <p className="field-note">{user.bio}</p>}
                    </div>
                  </Link>
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-sm"
                    as={Link}
                    to={`/messages?user=${user._id}`}
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    Message
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="post-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
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
            <p className="empty-copy text-center">All posts loaded.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Explore;
