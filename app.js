import express from "express";
import { PORT } from "./config/env.js";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import urlRouter from "./routes/url.route.js";
import RedirectRouter from "./routes/redirect.route.js";
import dashboardRoute from "./routes/dashboard.route.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import cors from "cors";

const app = express();
connectDB();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: ["http://localhost:5173", "https://yourdomain.com"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (req, res) => {
  res.send({ msg: `zip-links api is running.` });
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/url", urlRouter);
app.use("/api/dashboard", dashboardRoute);
app.use("/api", RedirectRouter);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
