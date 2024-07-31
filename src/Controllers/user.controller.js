import { ApiError } from "../Utils/apiError.js";
import { ApiResponse } from "../Utils/apiResponse.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../Utils/cloudinary.js";
import { User } from "../Models/users.model.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Failed to generate access and refresh tokens",
      error
    );
  }
};

const options = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation and sanitization - not empty
  // check if user already exists : username and email should be unique
  // check for images , check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in database
  // remove password and refresh tokens from response
  // check for user creation
  // return response

  const { username, email, password, fullName, role, language, bio } = req.body;
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const avatarLocalPath = req.file?.avatar[0]?.path;
  let coverImageLocalPath;

  if (req.files?.coverImage && req.files?.coverImage.length > 0) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    fs.unlinkSync(avatarLocalPath);
    if (coverImageLocalPath) {
      fs.unlinkSync(coverImageLocalPath);
    }
    throw new ApiError(
      400,
      "User with given username of email already exists",
      existedUser
    );
  }

  const avatarPublicId = await uploadOnCloudinary(avatarLocalPath);

  const coverImagePublicId = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarPublicId) {
    throw new ApiError(500, "Error while uploading avatar");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    avatar: avatarPublicId,
    coverImage: coverImagePublicId,
    role,
    language,
    bio,
  });

  const createdUser = user.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Error while creating user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
  // get data from request body
  // check for username and email
  // find the user
  // check for password
  // generate access and refresh token
  // send cookies
  // send response

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User doesnot exist");
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear cookies
  // remove refresh token from database
  // send response

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
