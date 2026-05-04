import jwt from "jsonwebtoken";
import { env } from "../config/env.config.js";

export const generateToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: "7d" });
