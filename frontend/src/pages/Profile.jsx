import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { profileService } from "../api/profileService";
import { postService } from "../api/postService";
import { authService } from "../api/authService";
import FollowButton from "../components/FollowButton";
import EditProfileModal from "../components/EditProfileModal";
import PostCard from "../components/PostCard";
import PostSkeleton from "../components/PostSkeleton";
import toast from "react-hot-toast";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getUser();
  const currentUserId = currentUser?.id || currentUser?._id;
  const isOwnProfile = currentUserId === id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const data = await profileService.getProfile(id);
      setProfile(data);
      setFollowersCount(data.followersCount || 0);
      setFollowingCount(data.followingCount || 0);
      setIsFollowing(data.isFollowing || false);
    } catch (err) {
      setError(err.response?.status === 404 ? "User not found" : "Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [id]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data = await postService.getUserPosts(id);
      setPosts(data.posts);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, [loadProfile, loadPosts]);

  const handleFollowChange = (following) => {
    setIsFollowing(following);
    setFollowersCount((c) => following ? c + 1 : c - 1);
  };

  const handleProfileSaved = (updated) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem("user", JSON.stringify({ ...parsed, username: updated.username }));
    }
  };

  const handleDeletePost = (postId) => setPosts((prev) => prev.filter((p) => p._id !== postId));

  if (loadingProfile) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 mb-6">
            <div className="flex gap-6">
              <div className="skeleton w-24 h-24 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-6 w-40 rounded" />
                <div className="skeleton h-4 w-64 rounded" />
                <div className="flex gap-6 mt-4">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-10 w-16 rounded" />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-sm">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-white font-bold text-lg mb-2">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-ghost mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile?.profilePic ? (
                <img src={profile.profilePic} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-cyan-400/30" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center text-white text-3xl font-black">
                  {profile?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-white font-black text-xl">@{profile?.username}</h1>
                {isOwnProfile ? (
                  <button onClick={() => setShowEdit(true)} className="btn-ghost text-sm px-3 py-1.5">Edit Profile</button>
                ) : (
                  <FollowButton userId={id} initialIsFollowing={isFollowing} onFollowChange={handleFollowChange} />
                )}
              </div>

              {profile?.bio ? (
                <p className="text-gray-300 text-sm mb-4">{profile.bio}</p>
              ) : (
                <p className="text-gray-600 text-sm italic mb-4">
                  {isOwnProfile ? "Add a bio..." : "No bio yet."}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-6">
                {[
                  { label: "Posts", value: profile?.postsCount ?? 0 },
                  { label: "Followers", value: followersCount },
                  { label: "Following", value: followingCount },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-white font-black text-xl">{stat.value}</p>
                    <p className="text-gray-500 text-xs uppercase tracking-wide">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Posts */}
        <h2 className="text-white font-bold text-lg mb-4">Posts</h2>
        {loadingPosts ? (
          <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <PostSkeleton key={i} />)}</div>
        ) : posts.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <p className="text-3xl mb-3">📷</p>
            <p className="text-gray-400">{isOwnProfile ? "Share your first post!" : "No posts yet."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
            ))}
          </div>
        )}
      </div>

      {showEdit && profile && (
        <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSaved={handleProfileSaved} />
      )}
    </div>
  );
}

export default Profile;
