import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  type: {
    type: String,
    enum: ['TEXT', 'SYSTEM', 'FILE'],
    default: 'TEXT'
  },
  file: {
    filename: String,        // Stored filename on server
    originalName: String,    // Original filename from user
    size: Number,           // File size in bytes
    mimeType: String,       // MIME type (e.g., 'image/png', 'application/pdf')
    url: String             // Cloudinary secure URL
  }
}, { timestamps: true });

// Indexes for performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export default mongoose.model("Message", messageSchema);
