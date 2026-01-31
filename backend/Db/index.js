// db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("Connection string:", process.env.MONGO_URL?.replace(/:[^:@]+@/, ':****@')); // Hide password

    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB successfully!");
  } catch (err) {
    console.error("❌ MongoDB Connection error:");
    console.error("Error message:", err.message);
    console.error("Error name:", err.name);
    if (err.reason) console.error("Reason:", err.reason);
    process.exit(1);
  }
};

export default connectDB;
