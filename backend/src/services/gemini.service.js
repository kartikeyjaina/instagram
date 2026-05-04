import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.config.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const GEMINI_MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

const runWithModelFallback = async (runner) => {
  let lastError;

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await runner(model);
    } catch (err) {
      const msg = err?.message || "";
      const isModelNotAvailable = msg.includes("404") || msg.includes("not found") || msg.includes("not supported");

      if (!isModelNotAvailable) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error("No supported Gemini model available for this API key");
};

export const generateAIComment = async (
  commentText,
  postCaption,
  commenterName = "someone",
) => {
  const prompt = `You are a friendly, witty social media AI assistant.
A user wants to reply to @${commenterName}'s comment: "${commentText}" on a post with caption: "${postCaption || "No caption"}".
Reply naturally in 1-2 sentences. Be helpful, engaging, and concise. No hashtags.`;

  const result = await runWithModelFallback((model) =>
    model.generateContent(prompt),
  );
  return result.response.text().trim();
};

export const generateCaption = async (context) => {
  const prompt = `Generate 3 creative Instagram-style captions for a photo described as: "${context}".
Format your response as a JSON array of objects with "caption" and "hashtags" fields.
Example: [{"caption": "...", "hashtags": ["#tag1", "#tag2"]}]
Return ONLY the JSON array, no other text.`;

  const result = await runWithModelFallback((model) =>
    model.generateContent(prompt),
  );
  const rawText = result.response.text().trim();
  const cleanJson = rawText
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  return JSON.parse(cleanJson);
};
