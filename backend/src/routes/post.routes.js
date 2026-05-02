import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  createPost, getAllPosts, getUserPosts, deletePost,
  likePost, unlikePost, getFeed, savePost, unsavePost, getSavedPosts,
} from "../controllers/post.controller.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Invalid file type"));
  },
});

const postRouter = Router();

postRouter.get("/feed", requireAuth, getFeed);
postRouter.get("/saved", requireAuth, getSavedPosts);
postRouter.get("/user/:id", requireAuth, getUserPosts);
postRouter.get("/", requireAuth, getAllPosts);
postRouter.post("/", requireAuth, upload.single("image"), createPost);
postRouter.delete("/:id", requireAuth, deletePost);
postRouter.post("/:id/like", requireAuth, likePost);
postRouter.post("/:id/unlike", requireAuth, unlikePost);
postRouter.post("/:id/save", requireAuth, savePost);
postRouter.post("/:id/unsave", requireAuth, unsavePost);

export default postRouter;
