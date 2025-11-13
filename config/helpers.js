import mongoose from "mongoose";
import { Click } from "../models/clicks.model.js";
import { Url } from "../models/url.model.js";

export const calculatePercentage = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

export const getTodayClickTrend = (ownerId, todayStart) => {
  return Click.aggregate([
    { $match: { ownerId, timestamp: { $gte: todayStart } } },
    {
      $group: {
        _id: { $hour: "$timestamp" },
        clicks: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        time: { $concat: [{ $substr: ["$_id", 0, 2] }, ":00"] },
        clicks: 1,
      },
    },
  ]);
};

export const getSevenDayTrend = (ownerId, sevenDaysAgo) => {
  return Click.aggregate([
    { $match: { ownerId, timestamp: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        clicks: { $sum: 1 },
        uniqueIps: { $addToSet: "$ipAddress" },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        clicks: 1,
        unique: { $size: "$uniqueIps" },
      },
    },
  ]);
};

export const getDeviceBreakdown = (ownerId) => {
  return Click.aggregate([
    { $match: { ownerId } },
    {
      $group: {
        _id: "$device.type",
        value: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        name: { $ifNull: ["$_id", "Other"] },
        value: 1,
      },
    },
  ]);
};

export const getGeoDistribution = (ownerId) => {
  return Click.aggregate([
    { $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },

    {
      $lookup: {
        from: "urls",
        localField: "urlId",
        foreignField: "_id",
        as: "urlDetails",
      },
    },

    { $unwind: "$urlDetails" },

    { $match: { "urlDetails.linkType": "geo" } },

    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$wasGeoRedirect", true] },
            then: { $ifNull: ["$geo.country", "Unknown"] },
            else: "Others",
          },
        },
        clicks: { $sum: 1 },
      },
    },

    {
      $project: {
        _id: 0,
        country: "$_id",
        clicks: 1,
      },
    },
    { $sort: { clicks: -1 } },
  ]);
};

export const getTopLinks = async (ownerId) => {
  const topLinks = await Url.find({ creator: ownerId })
    .sort({ totalClicks: -1 })
    .limit(5)
    .select("shortCode title totalClicks")
    .lean();

  const uniqueClickPromises = topLinks.map((link) => {
    return Click.distinct("ipAddress", { urlId: link._id }).then(
      (arr) => arr.length
    );
  });

  const uniqueClickCounts = await Promise.all(uniqueClickPromises);

  return topLinks.map((link, index) => ({
    shortCode: link.shortCode,
    title: link.title,
    clicks: link.totalClicks,
    uniqueVisitors: uniqueClickCounts[index],
  }));
};
