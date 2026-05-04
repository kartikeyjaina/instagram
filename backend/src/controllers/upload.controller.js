import { imagekit } from "../config/imagekit.config.js";
import { toFile } from "@imagekit/nodejs";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const sanitizeFilename = (originalname) =>
  originalname
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);

export const uploadImage = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, error: "No file provided" });

  const { mimetype, size, originalname, buffer } = req.file;

  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
      });
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    return res
      .status(400)
      .json({ success: false, error: "File too large. Maximum size is 5 MB." });
  }

  const uploadResponse = await imagekit.files.upload({
    file: await toFile(buffer, originalname),
    fileName: `${sanitizeFilename(originalname)}_${Date.now()}`,
    folder: "/profile-pics",
    useUniqueFileName: true,
  });

  res
    .status(200)
    .json({
      success: true,
      data: { url: uploadResponse.url, fileId: uploadResponse.fileId },
    });
};
