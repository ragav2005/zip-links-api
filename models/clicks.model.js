import mongoose from "mongoose";

const clickSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Url",
    required: true,
    index: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  wasGeoRedirect: {
    type: Boolean,
    default: false,
  },
  geo: {
    countryCode: { type: String },
    country: { type: String },
    region: { type: String },
  },
  device: {
    browser: { type: String },
    os: { type: String },
    type: { type: String },
  },
});
export const Click = mongoose.model("Click", clickSchema);
