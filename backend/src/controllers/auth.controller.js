import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { userModel } from "../models/user.model.js";
import { env } from "../config/env.config.js";

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  const isExistingUser = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isExistingUser) {
    return res.status(409).json({
      message: "Username or email already exists",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = new userModel({
    username: username,
    email: email,
    passwordHash: passwordHash,
  });

  await user.save();

  const token = jwt.sign({
    id: user._id,
  }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.status(201).json({
    message: "User registered successfully",
    token: token,
  });
};
