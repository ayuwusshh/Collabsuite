import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  users: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: {
        type: String,
        enum: ["owner", "admin", "member"],
        default: "member"
      }
    }
  ]
}, { timestamps: true });

export default mongoose.model("Workspace", workspaceSchema);
