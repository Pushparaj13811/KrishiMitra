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

  if (!fullName || !email || !username) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
        username,
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

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Language updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
  updateAccountDetails,
  updateUserBio,
  updateUserLanguage,
};
