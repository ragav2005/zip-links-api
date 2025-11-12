import { Router } from "express";
import { RedirectUrl } from "../controllers/redirect.controller.js";

const RedirectRouter = Router();

RedirectRouter.get("/:shortCode", RedirectUrl);

export default RedirectRouter;
