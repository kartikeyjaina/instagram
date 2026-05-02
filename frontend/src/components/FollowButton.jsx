import { useState } from "react";
import { motion } from "framer-motion";
import { followService } from "../api/followService";
import toast from "react-hot-toast";

function FollowButton({ userId, initialIsFollowing, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollow(userId);
        setIsFollowing(false);
        toast.success("Unfollowed");
        onFollowChange?.(false);
      } else {
        await followService.follow(userId);
        setIsFollowing(true);
        toast.success("Following!");
        onFollowChange?.(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={loading}
      className={isFollowing ? "btn-ghost" : "btn-primary"}
      style={{ minWidth: "110px" }}
    >
      {loading ? <div className="spinner mx-auto" style={{ width: 16, height: 16 }} /> : isFollowing ? "Following" : "Follow"}
    </motion.button>
  );
}

export default FollowButton;
