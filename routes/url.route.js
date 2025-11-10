import { Router } from "express";
import {
  shortenURL,
  getUrls,
  getGeoUrls,
  deleteUrl,
  addGeoRule,
  removeGeoRule,
} from "../controllers/url.controller.js";
import authorize from "../middlewares/auth.middleware.js";
const urlRouter = Router();

// route prefix -  /api/url/..

urlRouter.post("/shorten", authorize, shortenURL);
urlRouter.get("/get-urls", authorize, getUrls);
urlRouter.get("/get-geo-urls", authorize, getGeoUrls);
urlRouter.get("/delete/:id", authorize, deleteUrl);
urlRouter.post("/:id/add-geo-rule", authorize, addGeoRule);
urlRouter.get("/:id/remove-geo-rule/:rule_id", authorize, removeGeoRule);
export default urlRouter;
