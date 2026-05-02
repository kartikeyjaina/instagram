import { generateCaption } from "../services/gemini.service.js";

// POST /api/ai/generate-caption
export const generateCaptionHandler = async (req, res) => {
  const { context } = req.body;

  if (!context?.trim()) {
    return res.status(400).json({ message: "context is required" });
  }

  const suggestions = await generateCaption(context.trim());
  return res.status(200).json({ suggestions });
};
