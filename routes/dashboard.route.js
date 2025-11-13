import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import {
  getActivities,
  getGeoStats,
  getStats,
} from "../controllers/dashboard.controller.js";

const dashboardRoute = Router();

// route prefix -  /api/dashboard/..

dashboardRoute.get("/stats", authorize, getStats);
dashboardRoute.get("/activities", authorize, getActivities);
dashboardRoute.get("/geo-stats", authorize, getGeoStats);

export default dashboardRoute;
