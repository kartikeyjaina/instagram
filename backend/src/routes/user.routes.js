import { Router } from "express";
import { getUserProfile, updateUserProfile, searchUsers } from "../controllers/user.controller.js";
import { followUser, unfollowUser } from "../controllers/follow.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const userRouter = Router();

userRouter.get("/search", requireAuth, asyncHandler(searchUsers));
userRouter.get("/:id", requireAuth, asyncHandler(getUserProfile));
userRouter.put("/update", requireAuth, asyncHandler(updateUserProfile));
userRouter.post("/:id/follow", requireAuth, asyncHandler(followUser));
userRouter.post("/:id/unfollow", requireAuth, asyncHandler(unfollowUser));

export default userRouter;
