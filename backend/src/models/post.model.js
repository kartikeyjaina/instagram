import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  imageUrl: { type: String, required: true },
  caption: { type: String, default: "", maxlength: [500, "Caption too long"] },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
}, { timestamps: true });

export const postModel = mongoose.model("Post", postSchema);
