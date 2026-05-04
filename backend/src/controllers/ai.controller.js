import {
  generateAIComment,
  generateCaption,
} from "../services/gemini.service.js";

export const generateCaptionHandler = async (req, res) => {
  const { context } = req.body;

  if (!context?.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "context is required" });
  }

  const suggestions = await generateCaption(context.trim());
  res.status(200).json({ success: true, data: { suggestions } });
};

export const generateCommentReplyHandler = async (req, res) => {
  const { commentText, postCaption, commenterName } = req.body;

  if (!commentText?.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "commentText is required" });
  }

  const suggestion = await generateAIComment(
    commentText.trim(),
    postCaption?.trim(),
    commenterName?.trim() || "someone",
  );

  res.status(200).json({ success: true, data: { suggestion } });
};
