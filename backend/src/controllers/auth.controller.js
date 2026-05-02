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

  const token = jwt.sign(
    {
      id: user._id,
    },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.status(201).json({
    message: "User registered successfully",
    token: token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if(!isPasswordValid){
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }
  const token = jwt.sign(
    {id: user._id},
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  )
    res.status(200).json({
        message: "Login successful",
        token: token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })
};
