import { Router } from "express";
import { getUserProfile, updateUserProfile, searchUsers } from "../controllers/user.controller.js";
import { followUser, unfollowUser } from "../controllers/follow.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.get("/search", requireAuth, searchUsers);
userRouter.get("/:id", requireAuth, getUserProfile);
userRouter.put("/update", requireAuth, updateUserProfile);
userRouter.post("/:id/follow", requireAuth, followUser);
userRouter.post("/:id/unfollow", requireAuth, unfollowUser);

export default userRouter;
