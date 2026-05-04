import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    text: {
      type: String,
      required: true,
      maxlength: [1000, "Comment too long"],
    },
    isAI: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const commentModel = mongoose.model("Comment", commentSchema);
