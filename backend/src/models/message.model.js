import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  text: { type: String, required: true, maxlength: [2000, "Message too long"] },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const messageModel = mongoose.model("Message", messageSchema);
