import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.config.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const generateAIComment = async (commentText, postCaption) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a friendly, witty social media AI assistant.
A user commented "@ai ${commentText}" on a post with caption: "${postCaption || "No caption"}".
Reply naturally in 1-2 sentences. Be helpful, engaging, and concise. No hashtags.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

export const generateCaption = async (context) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate 3 creative Instagram-style captions for a photo described as: "${context}".
Format your response as a JSON array of objects with "caption" and "hashtags" fields.
Example: [{"caption": "...", "hashtags": ["#tag1", "#tag2"]}]
Return ONLY the JSON array, no other text.`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text().trim();
  const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleanJson);
};
