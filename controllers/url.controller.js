import mongoose from "mongoose";
import validator from "validator";
import { nanoid } from "nanoid";
import { Url } from "../models/url.model.js";
import { Activity } from "../models/activity.model.js";

export const shortenURL = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { defaultUrl, title, customAlias } = req.body;
  const userId = req.user._id;
  try {
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
      title: title || "",
      geoRules: [],
    });

    await newUrl.save({ session });

    const message = title
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
        .json({ msg: "That alias was just taken. Try again." });
    }
    next(error);
  }
};
