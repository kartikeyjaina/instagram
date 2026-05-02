import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createPost, getAllPosts, getUserPosts, deletePost,
  likePost, unlikePost, getFeed, savePost, unsavePost, getSavedPosts,
} from "../controllers/post.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Invalid file type"));
  },
});

const postRouter = Router();

postRouter.get("/feed", requireAuth, asyncHandler(getFeed));
postRouter.get("/saved", requireAuth, asyncHandler(getSavedPosts));
postRouter.get("/user/:id", requireAuth, asyncHandler(getUserPosts));
postRouter.get("/", requireAuth, asyncHandler(getAllPosts));
postRouter.post("/", requireAuth, upload.single("image"), asyncHandler(createPost));
postRouter.delete("/:id", requireAuth, asyncHandler(deletePost));
postRouter.post("/:id/like", requireAuth, asyncHandler(likePost));
postRouter.post("/:id/unlike", requireAuth, asyncHandler(unlikePost));
postRouter.post("/:id/save", requireAuth, asyncHandler(savePost));
postRouter.post("/:id/unsave", requireAuth, asyncHandler(unsavePost));

export default postRouter;
