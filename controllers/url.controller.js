import mongoose from "mongoose";
import validator from "validator";
import { nanoid } from "nanoid";
import { Url } from "../models/url.model.js";
import { Activity } from "../models/activity.model.js";

export const shortenURL = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { defaultUrl, title, customAlias, linkType } = req.body;
  const userId = req.user._id;
  try {
    if (!linkType || !["normal", "geo"].includes(linkType)) {
      return res
        .status(400)
        .json({ message: 'A valid linkType ("normal" or "geo") is required.' });
    }

    if (linkType === "geo" && !title) {
      return res
        .status(400)
        .json({ message: "Title is required for Geo-Urls." });
    }

    if (!defaultUrl || !validator.isURL(defaultUrl)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid long URL or fallback URL." });
    }

    let shortCode;

    if (customAlias) {
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res
          .status(400)
          .json({ message: "This custom alias is already in use." });
      }
      shortCode = customAlias;
    } else {
      let newCode = null;
      let isUnique = false;
      while (!isUnique) {
        newCode = nanoid(7);
        const existing = await Url.findOne({ shortCode: newCode });
        if (!existing) {
          isUnique = true;
        }
      }
      shortCode = newCode;
    }
    const newUrl = new Url({
      creator: userId,
      shortCode: shortCode,
      defaultUrl: defaultUrl,
      linkType: linkType,
      title: linkType === "geo" ? title : null,
      geoRules: linkType === "geo" ? [] : null,
    });

    await newUrl.save({ session });

    const message =
      linkType === "geo"
        ? `You created a new Geo-Url: ${title} (${shortCode})`
        : `You created a new link: ${shortCode}`;

    Activity.create({
      userId: userId,
      eventType: "URL_CREATED",
      message: message,
      relatedUrlId: newUrl._id,
    }).catch((err) => {
      console.error("Failed to log URL creation activity:", err);
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "URL shortened successfully",
      data: newUrl,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "That alias was just taken. Try again." });
    }
    next(error);
  }
};

export const getUrls = async (req, res, next) => {
  try {
    const urls = await Url.find({
      creator: req.user.id,
      linkType: "normal",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "URLs fetched successfully",
      data: urls,
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

export const getGeoUrls = async (req, res, next) => {
  try {
    const geoUrls = await Url.find({
      creator: req.user.id,
      linkType: "geo",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Geo-URLs fetched successfully",
      data: geoUrls,
    });
  } catch (error) {
    console.error(error.message);
    next(error);
  }
};

export const deleteUrl = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const urlId = req.params.id;
    const userId = req.user._id;

    const url = await Url.findOne({ _id: urlId, creator: userId }).session(
      session
    );
    if (!url) {
      return res.status(404).json({ message: "URL not found." });
    }

    await Url.deleteOne({ _id: urlId, creator: userId }).session(session);

    Activity.create({
      userId: userId,
      eventType: "URL_DELETED",
      message: `You deleted the link: ${url.shortCode}`,
      relatedUrlId: url._id,
    }).catch((err) => {
      console.error("Failed to log URL deletion activity:", err);
    });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ success: true, message: "URL deleted successfully.", data: url });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const addGeoRule = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { country, destinationUrl, countryCode } = req.body;
  const urlId = req.params.id;
  const userId = req.user.id;

  try {
    if (
      !country ||
      !countryCode ||
      !destinationUrl ||
      !validator.isURL(destinationUrl)
    ) {
      return res.status(400).json({
        message:
          "Please provide a valid country, country code, and destination URL.",
      });
    }

    const url = await Url.findById(urlId);
    if (!url) {
      return res.status(404).json({ message: "URL not found." });
    }

    if (url.creator.toString() !== userId) {
      return res.status(401).json({ message: "User not authorized." });
    }
    if (url.linkType !== "geo") {
      return res
        .status(400)
        .json({ message: "Rules can only be added to geo-links." });
    }

    url.geoRules.find((rule) => rule.countryCode === countryCode);
    if (
      url.geoRules.some(
        (rule) => rule.country === country || rule.countryCode === countryCode
      )
    ) {
      return res
        .status(400)
        .json({ message: "A rule for this country already exists." });
    }

    const newRule = { country, destinationUrl, countryCode };
    url.geoRules.push(newRule);

    await url.save();
    await session.commitTransaction();
    session.endSession();

    Activity.create({
      userId: userId,
      eventType: "GEO_RULE_CREATED",
      message: `Added geo-rule for ${country} to link ${url.shortCode}`,
      relatedUrlId: url._id,
    }).catch((err) => console.error("Failed to log activity:", err));

    res.status(201).json({
      success: true,
      message: "Geo-rule added successfully",
      data: url.geoRules,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err.message);
    next(err);
  }
};

export const removeGeoRule = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { id: urlId, rule_id: ruleId } = req.params;
  const userId = req.user.id;

  try {
    const url = await Url.findById(urlId);
    if (!url) {
      return res.status(404).json({ message: "URL not found." });
    }

    if (url.creator.toString() !== userId) {
      return res.status(401).json({ message: "User not authorized." });
    }

    const rule = url.geoRules.id(ruleId);
    if (!rule) {
      return res.status(404).json({ message: "Rule not found." });
    }
    const country = rule.country;

    url.geoRules.pull({ _id: ruleId });

    await url.save();
    await session.commitTransaction();
    session.endSession();

    Activity.create({
      userId: userId,
      eventType: "GEO_RULE_DELETED",
      message: `Removed geo-rule for ${country} from link ${url.shortCode}`,
      relatedUrlId: url._id,
    }).catch((err) => console.error("Failed to log activity:", err));

    res.status(200).json({
      success: true,
      message: "Rule deleted successfully.",
      data: url.geoRules,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err.message);
    next(err);
  }
};
