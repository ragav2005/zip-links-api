import mongoose from "mongoose";
import { User } from "../models/user.model.js";

export const getUser = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }
  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const verifyToken = async (req, res, next) => {
  const user = req.user;

  try {
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token (user not found)",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token is valid",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const user = req.user;

  try {
    const userId = user._id;

    const { name, avatar } = req.body;

    if (!name && !avatar) {
      return res.status(400).json({
        success: false,
        message: "At least one field (name or avatar) must be provided",
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};
