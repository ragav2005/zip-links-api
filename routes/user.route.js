import { Router } from "express";
import { getUser, verifyToken } from "../controllers/user.controller.js";

const userRoute = Router();

// route prefix -  /api/user/..

userRoute.get("/get/:id", getUser);
userRoute.post("/verify-token", verifyToken);

export default userRoute;
