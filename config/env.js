import { config } from "dotenv";
import process from "process";

config({ path: ".env" });

export const { PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN } = process.env;
