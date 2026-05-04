import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";
import { userModel } from "../models/user.model.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const userId = payload.id || payload.sub;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }
    req.user = user;
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
};
