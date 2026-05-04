import { useState } from "react";
import { motion } from "framer-motion";
import { followService } from "../api/followService";
import toast from "react-hot-toast";
import Button from "./ui/Button";

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
    <motion.div whileTap={{ scale: 0.95 }}>
      <Button
        onClick={handleClick}
        disabled={loading}
        variant={isFollowing ? "secondary" : "primary"}
        block
      >
        {loading ? (
          <div className="spinner" />
        ) : isFollowing ? (
          "Following"
        ) : (
          "Follow"
        )}
      </Button>
    </motion.div>
  );
}

export default FollowButton;
