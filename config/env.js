import { config } from "dotenv";
import process from "process";

config({ path: ".env" });

export const { PORT } = process.env;
