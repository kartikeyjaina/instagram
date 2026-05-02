import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  type: {
    type: String,
    enum: ["follow", "like", "comment", "ai_reply"],
    required: true,
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

export const notificationModel = mongoose.model("Notification", notificationSchema);
