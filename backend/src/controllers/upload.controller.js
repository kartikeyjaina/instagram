import { imagekit } from "../config/imagekit.config.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided" });
  }

  const { mimetype, size, originalname, buffer } = req.file;

  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return res.status(400).json({
      message: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
    });
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    return res.status(400).json({
      message: "File too large. Maximum size is 5 MB.",
    });
  }

  // Sanitize filename — strip extension, keep alphanumeric + hyphens
  const baseName = originalname
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);

  const fileName = `${baseName}_${Date.now()}`;

  const uploadResponse = await imagekit.upload({
    file: buffer,
    fileName,
    folder: "/profile-pics",
    useUniqueFileName: true,
  });

  return res.status(200).json({
    url: uploadResponse.url,
    fileId: uploadResponse.fileId,
  });
};
