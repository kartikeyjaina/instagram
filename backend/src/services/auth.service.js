import { userModel } from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/token.js";

const buildPublicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
});

export const registerUser = async ({ username, email, password }) => {
  const existingUser = await userModel.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    const conflict = new Error("Username or email already exists");
    conflict.statusCode = 409;
    throw conflict;
  }

  const passwordHash = await hashPassword(password);
  const user = await userModel.create({ username, email, passwordHash });
  const token = generateToken(user._id);

  return { token, user: buildPublicUser(user) };
};

export const loginUser = async ({ email, password }) => {
  const user = await userModel.findOne({ email }).select("+passwordHash");
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user._id);
  return { token, user: buildPublicUser(user) };
};
