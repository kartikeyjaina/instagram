import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  CORS_ORIGINS: z.string().optional(),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  IMAGEKIT_PUBLIC_KEY: z.string().min(1, "IMAGEKIT_PUBLIC_KEY is required"),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1, "IMAGEKIT_PRIVATE_KEY is required"),
  IMAGEKIT_URL_ENDPOINT: z
    .string()
    .url("IMAGEKIT_URL_ENDPOINT must be a valid URL"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
};
