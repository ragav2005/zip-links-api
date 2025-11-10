import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true, //URL_CREATED, GEO_RULE_CREATED, GEO_RULE_DELETED, URL_DELETED.
  },
  message: {
    type: String,
    required: true,
  },
  relatedUrlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Url",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const Activity = mongoose.model("Activity", activitySchema);
