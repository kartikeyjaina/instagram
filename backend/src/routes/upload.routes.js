import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../controllers/upload.controller.js";

// Store file in memory so we can pass the buffer directly to ImageKit
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard limit at multer level
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

const uploadRouter = Router();

// POST /api/upload  — protected, accepts a single "image" field
uploadRouter.post("/", requireAuth, upload.single("image"), uploadImage);

export default uploadRouter;
