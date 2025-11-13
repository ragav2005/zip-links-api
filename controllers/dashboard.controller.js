import { Click } from "../models/clicks.model.js";
import { Url } from "../models/url.model.js";
import { Activity } from "../models/activity.model.js";
import mongoose from "mongoose";
import {
  getDeviceBreakdown,
  getGeoDistribution,
  getTodayClickTrend,
  getSevenDayTrend,
  getTopLinks,
  calculatePercentage,
} from "../config/helpers.js";

export const getStats = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 7));
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
    const sixtyDaysAgo = new Date(new Date().setDate(today.getDate() - 60));

    const [
      currentTotalClicks,
      currentUniqueClicksArr,
      currentTotalLinks,

      prevTotalClicks,
      prevUniqueClicksArr,
      prevTotalLinks,

      allTimeTotalLinks,

      todayClickTrend,
      sevenDayTrend,
      deviceBreakdown,
      geoDistribution,
      topLinks,
    ] = await Promise.all([
      Click.countDocuments({
        ownerId: userId,
        timestamp: { $gte: thirtyDaysAgo },
      }),
      Click.distinct("ipAddress", {
        ownerId: userId,
        timestamp: { $gte: thirtyDaysAgo },
      }),
      Url.countDocuments({
        creator: userId,
        createdAt: { $gte: thirtyDaysAgo },
      }),

      Click.countDocuments({
        ownerId: userId,
        timestamp: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      }),
      Click.distinct("ipAddress", {
        ownerId: userId,
        timestamp: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      }),
      Url.countDocuments({
        creator: userId,
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      }),

      Url.countDocuments({ creator: userId }),

      getTodayClickTrend(userId, todayStart),
      getSevenDayTrend(userId, sevenDaysAgo),
      getDeviceBreakdown(userId),
      getGeoDistribution(userId),
      getTopLinks(userId),
    ]);

    const allTimeTotalClicks = await Click.countDocuments({ ownerId: userId });
    const currentUniqueClicks = currentUniqueClicksArr.length;
    const prevUniqueClicks = prevUniqueClicksArr.length;

    const overview = {
      totalClicks: {
        value: allTimeTotalClicks,
        change: calculatePercentage(currentTotalClicks, prevTotalClicks),
      },
      totalLinks: {
        value: allTimeTotalLinks,
        change: calculatePercentage(currentTotalLinks, prevTotalLinks),
      },
      uniqueClicks: {
        value: currentUniqueClicks,
        change: calculatePercentage(currentUniqueClicks, prevUniqueClicks),
      },
      avgClicksPerLink:
        allTimeTotalLinks > 0 ? allTimeTotalClicks / allTimeTotalLinks : 0,
    };

    const totalGeoClicks = geoDistribution.reduce(
      (sum, item) => sum + item.clicks,
      0
    );

    const charts = {
      deviceBreakdown,
      geoDistribution: geoDistribution.map((item) => ({
        ...item,
        percentage:
          totalGeoClicks > 0
            ? ((item.clicks / totalGeoClicks) * 100).toFixed(0)
            : 0,
      })),
    };

    res.json({
      sucess: true,
      message: "Stats fetched successfully",
      data: {
        overview,
        trends: {
          todayClickTrend,
          sevenDayTrend,
        },
        charts,
        topLinks,
      },
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

export const getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      sucess: true,
      message: "Activities fetched successfully",
      data: activities,
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};

export const getGeoStats = async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  try {
    const [totalGeoClicks, rulesStatsResult] = await Promise.all([
      Click.countDocuments({
        ownerId: userId,
        wasGeoRedirect: true,
      }),

      Url.aggregate([
        { $match: { creator: userId, linkType: "geo" } },

        { $unwind: "$geoRules" },

        {
          $group: {
            _id: null,
            totalGeoRules: { $sum: 1 },
            countriesTargeted: { $addToSet: "$geoRules.countryCode" },
          },
        },
      ]),
    ]);

    const rulesStats = rulesStatsResult[0] || {
      totalGeoRules: 0,
      countriesTargeted: [],
    };

    res.json({
      sucess: true,
      message: "Geo stats fetched successfully",
      data: {
        totalGeoClicks: totalGeoClicks,
        totalGeoRules: rulesStats.totalGeoRules,
        countriesTargeted: rulesStats.countriesTargeted,
      },
    });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
};
