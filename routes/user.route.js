import { Router } from "express";
import {
  getUser,
  verifyToken,
  updateUser,
} from "../controllers/user.controller.js";
import authorize from "../middlewares/auth.middleware.js";

const userRoute = Router();

// route prefix -  /api/user/..

userRoute.get("/get/:id", getUser);
userRoute.get("/verify-token", authorize, verifyToken);
userRoute.post("/update-user", authorize, updateUser);

export default userRoute;
``;
