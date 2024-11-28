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
import { UserProfile } from "../Models/userProfile.model.js";

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
  const avatarLocalPath = req.files?.avatar[0]?.path;
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
      "User with given username or email already exists",
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
    avatar: avatarPublicId.url,
    coverImage: coverImagePublicId.url,
    role: role || "user",
    language,
    bio,
  });

  if (!user) {
    throw new ApiError(500, "Error while creating user");
  }

  await UserProfile.create({
    userId: user._id,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Error while creating user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User created successfully", createdUser));
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

  const isPasswordMatch = await user.isPasswordCorrect(password);

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

const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const userProfile = await User.aggregate([
    { $match: { _id: userId } },
    {
      $lookup: {
        from: "userprofiles",
        localField: "_id",
        foreignField: "userId",
        as: "profile",
      },
    },
    { $unwind: "$profile" },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
        fullName: 1,
        role: 1,
        language: 1,
        avatar: 1,
        coverImage: 1,
        bio: 1,
        createdAt: "$profile.createdAt",
        updatedAt: "$profile.updatedAt",
        title: "$profile.title",
        location: "$profile.location",
        experience: "$profile.experience",
        farmSize: "$profile.farmSize",
        primaryCrops: "$profile.primaryCrops",
        certifications: "$profile.certifications",
        recentActivities: "$profile.recentActivities",
        equipment: "$profile.equipment",
        lastSoilTest: "$profile.lastSoilTest",
        activeSubscription: "$profile.activeSubscription",
        soilHealth: "$profile.soilHealth",
        waterEfficiency: "$profile.waterEfficiency",
        yieldForecast: "$profile.yieldForecast",
        sustainability: "$profile.sustainability",
      },
    },
  ]);

  if (!userProfile || userProfile.length === 0) {
    throw new ApiError(404, "User profile not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User profile fetched successfully", userProfile[0]));

});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get refresh token from cookies
  // check for refresh token
  // verify refresh token
  // generate new access token

  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.query?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or invalid");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: refreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new ApiError(
      401,
      "Failed to refresh access token :",
      error?.message || "Invalid refresh token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password cannot be same as old password");
  }
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }
  if (
    (newPassword &&
      user?.username &&
      newPassword.toLowerCase().includes(user.username.toLowerCase())) ||
    newPassword.toLowerCase().includes(user.email.toLowerCase()) ||
    user?.username.includes(newPassword.toLowerCase())
  ) {
    throw new ApiError(400, "Password cannot be similar to username");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = await req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is missing");
  }

  const newAvatar = await uploadOnCloudinary(avatarLocalPath, "image");

  // delete old image from cloudinary

  if (!newAvatar) {
    throw new ApiError(500, "Failed to upload avatar image");
  }

  const oldAvatarImage = (await User.findById(req.user?._id))?.avatar;

  if (!oldAvatarImage) {
    throw new ApiError(404, "Old avatar image not found");
  }

  const avatarPublicId = oldAvatarImage.split("/").pop().split(".")[0];

  await deleteFromCloudinary(avatarPublicId);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: newAvatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(500, "Failed to upload cover image");
  }

  const oldCoverImage = (await User.findById(req.user?._id))?.coverImage;

  if (oldCoverImage) {
    const coverImagePublicId = oldCoverImage.split("/").pop().split(".")[0];
    await deleteFromCloudinary(coverImagePublicId, "image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;

  if (!fullName) {
    throw new ApiError(400, "All fields are required");
  }
  let data = {};
  if (fullName) {
    data.fullName = fullName;
  }
  if (email) {
    data.email = email;
  }
  if (username) {
    data.username = username;
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        ...data,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const updateFields = {};

  const fields = [
    "title",
    "location",
    "experience",
    "farmSize",
    "primaryCrops",
    "certifications",
    "lastSoilTest",
    "activeSubscription",
    "soilHealth",
    "waterEfficiency",
    "yieldForecast",
    "sustainability",
    "recentActivities",
    "equipment",
  ];


  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateFields[field] = req.body[field];
    }
    if ( field === "lastSoilTest") {
      updateFields["recentActivities"] =
        [{
          date: req.body[field],
          activity: "Soil Test",
          status: "Completed",
        }]

    }
  });

  if (updateFields == null || Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  try {
    let userProfile = await UserProfile.findOne({ userId });

    if (!userProfile) {
      userProfile = new UserProfile({ userId, ...updateFields });
      await userProfile.save();
    }
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedProfile) {
      throw new ApiError(404, "User profile not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "User profile updated successfully", updatedProfile));

  } catch (error) {
    throw new ApiError(500, "Failed to update user profile", error);
  }
});

const updateUserBio = asyncHandler(async (req, res) => {
  const { bio } = req.body;

  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        bio,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Bio updated successfully"));
});

const updateUserLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;

  if (!language) {
    throw new ApiError(400, "Language is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        language,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  console.log("Backend :: usercontroller :: user : ",user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Language updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
  updateAccountDetails,
  updateUserBio,
  updateUserLanguage,
};
