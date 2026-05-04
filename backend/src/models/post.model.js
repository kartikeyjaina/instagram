import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  imageUrl: { type: String, required: true },
  caption: { type: String, default: "", maxlength: [500, "Caption too long"] },
  likesCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export const postModel = mongoose.model("Post", postSchema);
