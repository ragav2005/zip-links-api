import mongoose from "mongoose";
import { MONGODB_URI } from "./env.js";
import process from "process";

const connectDB = async () => {
  const startTime = Date.now();
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    const endTime = Date.now();
    console.log(
      `MongoDB Connected: ${conn.connection.host} (took ${
        endTime - startTime
      }ms)`
    );
  } catch (err) {
    console.log(
      `Failed to connect with db. Error: ${err.message || JSON.stringify(err)}`
    );
    process.exit(1);
  }
};

export default connectDB;
