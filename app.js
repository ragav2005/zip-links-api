import express from "express";
import { PORT } from "./config/env.js";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();
connectDB();

app.get("/", (req, res) => {
  res.send({ msg: "Hello, World!" });
});

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
