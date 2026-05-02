import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "API is healthy" });
  });

  app.use("/api/auth", authRouter);

  return app;
};
