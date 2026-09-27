import mongoose from "mongoose";
import env from "./env.config.js";
import logger from "../utils/logger.js";

export const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri);
    logger.info("MongoDB Atlas connected");
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
