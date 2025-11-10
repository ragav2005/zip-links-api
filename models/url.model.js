import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    linkType: {
      type: String,
      required: true,
      enum: ["normal", "geo"],
      default: "normal",
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    defaultUrl: {
      type: String,
      trim: true,
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    geoRules: [
      {
        country: {
          type: String,
          required: true,
        },
        destinationUrl: {
          type: String,
          required: true,
        },
        clicks: {
          type: Number,
          default: 0,
        },
        countryCode: {
          type: String,
          required: true,
        },
      },
    ],
    totalClicks: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Url = mongoose.model("Url", urlSchema);
