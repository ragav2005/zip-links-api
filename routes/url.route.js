import { Router } from "express";
import { shortenURL } from "../controllers/url.controller.js";
import authorize from "../middlewares/auth.middleware.js";
const urlRouter = Router();

// route prefix -  /api/url/..

urlRouter.post("/shorten", authorize, shortenURL);

export default urlRouter;
