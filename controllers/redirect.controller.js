import axios from "axios";
import { UAParser } from "ua-parser-js";
import { Click } from "../models/clicks.model.js";
import { Url } from "../models/url.model.js";

export const RedirectUrl = async (req, res, next) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });

    if (!url) {
      return res.status(404).json({ message: "Link not found" });
    }

    // ip look out
    const ip = req.ip.includes("127.0.0.1") ? "157.51.67.172" : req.ip;
    let geoData = { countryCode: null, country: null, region: null };
    try {
      const geoResponse = await axios.get(
        `http://ip-api.com/json/${ip}?fields=57355`
      );
      geoData = {
        countryCode: geoResponse.data.countryCode,
        country: geoResponse.data.country,
        region: geoResponse.data.regionName,
      };
      console.log("geoData:", geoData);
    } catch (geoError) {
      throw new Error("Geo-lookup failed:", geoError.message);
    }

    // destination url lookout
    let destinationUrl = url.defaultUrl;
    let wasGeoRedirect = false;
    let matchedRuleId = null;

    if (url.linkType === "geo" && url.geoRules.length > 0 && geoData.country) {
      const rule = url.geoRules.find(
        (r) => r.countryCode === geoData.countryCode
      );
      if (rule) {
        destinationUrl = rule.destinationUrl;
        wasGeoRedirect = true;
        matchedRuleId = rule._id;
      }
      console.log("rule:", rule);
    }

    if (
      !destinationUrl.startsWith("http://") &&
      !destinationUrl.startsWith("https://")
    ) {
      destinationUrl = "https://" + destinationUrl;
    }

    // send to user

    res.redirect(destinationUrl);

    // log data in clicks model
    const parser = new UAParser(req.headers["user-agent"]);
    const ua = parser.getResult();

    let deviceType = ua.device.type;
    if (!deviceType) {
      const uaString = req.headers["user-agent"].toLowerCase();
      if (
        uaString.includes("mobile") ||
        (uaString.includes("android") && !uaString.includes("tablet"))
      ) {
        deviceType = "mobile";
      } else if (uaString.includes("tablet") || uaString.includes("ipad")) {
        deviceType = "tablet";
      } else {
        deviceType = "desktop";
      }
    }

    const deviceData = {
      browser: ua.browser.name || "Unknown",
      os: ua.os.name || "Unknown",
      type: deviceType,
    };

    Click.create({
      urlId: url._id,
      ownerId: url.creator,
      timestamp: new Date(),
      ipAddress: ip,
      wasGeoRedirect: wasGeoRedirect,
      geo: geoData,
      device: deviceData,
    }).catch((err) => {
      throw new Error("Error logging click:", err);
    });

    // inc main url clicks
    Url.updateOne({ _id: url._id }, { $inc: { totalClicks: 1 } }).catch(
      (err) => {
        throw new Error("Error incrementing totalClicks:", err);
      }
    );

    // inc rule clicks
    if (wasGeoRedirect && matchedRuleId) {
      Url.updateOne(
        { _id: url._id, "geoRules._id": matchedRuleId },
        { $inc: { "geoRules.$.clicks": 1 } }
      ).catch((err) => {
        throw new Error("Error incrementing geo rule clicks:", err);
      });
    }
  } catch (err) {
    console.error("redirect error:", err);
    next(err);
  }
};
