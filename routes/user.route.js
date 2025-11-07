import { Router } from "express";
import {
  getUser,
  verifyToken,
  updateUser,
} from "../controllers/user.controller.js";

const userRoute = Router();

// route prefix -  /api/user/..

userRoute.get("/get/:id", getUser);
userRoute.get("/verify-token", verifyToken);
userRoute.post("/update-user", updateUser);

export default userRoute;
``;
