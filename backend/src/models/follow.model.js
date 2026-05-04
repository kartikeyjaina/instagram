import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const followModel = mongoose.model("Follow", followSchema);
