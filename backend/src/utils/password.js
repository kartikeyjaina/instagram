import bcrypt from "bcryptjs";

export const hashPassword = (plainText) => bcrypt.hash(plainText, 10);

export const comparePassword = (plainText, hash) => bcrypt.compare(plainText, hash);
