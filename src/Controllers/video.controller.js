import { ApiResponse } from "../Utils/apiResponse.js";
import { ApiError } from "../Utils/apiError.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../Utils/cloudinary.js";
import { Video } from "../Models/videos.model.js";
import { CropVideo } from "../Models/cropVideos.model.js";
import getVideoDuration from "../Utils/duration.js";

const uploadVideo = asyncHandler(async (req, res) => {
  // Get the title, description, language from the request body
  // Valid and sanitize the input fields
  // Get the user id from the request object
  // Check if the user is authenticated
  // Check if the required fields are provided
  // Get the video file path from the request object
  // Check if the video file path is provided
  // Upload the video file on cloudinary
  // Check if the video file is uploaded successfully
  // Create a new video document in the database
  // Send the response

  const { title, description, language } = req.body;

  console.log("Request received : ", req.body);

  console.log("Title : ", title);
  console.log("Description : ", description);



  if ([title, description].includes(undefined || null || "")) {
    throw new ApiError(400, "Please provide all the required fields");
  }
  const uploadedby = req.user?._id;
  if (!uploadedby) {
    throw new ApiError(400, "Unauthorized request");
  }

  console.log("Video : ", req.file?.video);
  console.log("Thumbnail : ", req.file?.thumbnail);

  const localVideoPath = req.file?.video[0]?.path;
  const lovalThumbnailPath = req.file?.thumbnail[0]?.path;

  console.log("Local Video Path : ",  req.file?.video[0]?.path);
  console.log("Local Thumbnail Path : ",  req.file?.thumbnail[0]?.path);

  if (!localVideoPath || !lovalThumbnailPath) {
    throw new ApiError(400, "Please provide a video file and thumbnail");
  }
  const videoDuration = await getVideoDuration(localVideoPath);

  const videoPath = await uploadOnCloudinary(localVideoPath, "video");
  const thumbnailPath = await uploadOnCloudinary(lovalThumbnailPath, "image");

  if (!videoPath || !thumbnailPath) {
    throw new ApiError(500, "Unable to upload video or thumbnail");
  }

  const video = await Video.create({
    title,
    description,
    language,
    url: videoPath,
    thumbnail: thumbnailPath,
    duration: videoDuration,
    uploadedby,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  // Get the video id from the request params
  // Get the user id from the request object
  // Get the video document from the database
  // Check if the video document exists
  // Check if the user is the owner of the video
  // Delete the video document from the database
  // Delete the video file from cloudinary
  // Send the response

  const videoId = req.params?.id;

  if (!videoId) {
    throw new ApiError(400, "Unable to get video id");
  }
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "Unauthorized request");
  }

  const video = await Video.findOneAndDelete({
    _id: videoId,
    uploadedby: userId,
  });

  if (!video) {
    throw new ApiError(404, "Unauthorized request or video not found");
  }

  const videoCloudinaryId = video.url.split("/").pop().split(".")[0];

  await deleteFromCloudinary(videoCloudinaryId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  // Get the page and limit from the query params
  // Get the videos from the database
  // Check if the videos exist
  // Send the response

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  if (page < 1 || limit < 1) {
    return res
      .status(400)
      .json(
        new ApiResponse(400, null, "Page and limit must be positive integers")
      );
  }

  const videos = await Video.aggregate([
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "uploadedby",
        foreignField: "_id",
        as: "uploader",
      },
    },
    { $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        language: 1,
        url: 1,
        uploader: {
          username: 1,
          avatar: 1,
        },
      },
    },
  ]);

  if (videos.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, "No videos found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos retrieved successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  // Get the video id from the request params
  // Get the video from the database
  // Check if the video exists
  // Send the response

  const videoId = req.params?.id;

  if (!videoId) {
    throw new ApiError(400, "Unable to get video id");
  }

  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "Users",
        localField: "uploadedby",
        foreignField: "_id",
        as: "uploadedby",
      },
    },
    {
      $unwind: "$uploadedby",
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        url: 1,
        language: 1,
        uploadedby: {
          username: { $arrayElemAt: [$uploadedby.username, 0] },
          avatar: { $arrayElemAt: [$uploadedby.avatar, 0] },
        },
      },
    },
  ]);

  if (video.length === 0) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video retrieved successfully"));
});

const uploadVideoToCropVideo = asyncHandler(async (req, res) => {
  // Get the video id and crop id from the request params and request body
  // Check if the video id is provided
  // Check if the crop id is provided
  // Find the video and crop documents from the database
  // Check if the video and crop documents exist
  // Check if the video is already linked to the crop
  // Create a new crop video document in the database
  // Send the response

  const videoId = req.params?.id;
  const { cropId } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video id is missing");
  }

  if (!cropId) {
    throw new ApiError(400, "Crop id is missing");
  }
  const result = await CropVideo.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "videoId",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $unwind: "$video",
    },
    {
      $match: {
        "video._id": videoId,
        "video.owner": req.user?._id,
      },
    },
    {
      $lookup: {
        from: "crops",
        localField: "cropId",
        foreignField: "_id",
        as: "crop",
      },
    },
    {
      $unwind: "$crop",
    },
    {
      $match: {
        "crop._id": cropId,
        "crop.owner": req.user?._id,
      },
    },
    {
      $lookup: {
        from: "cropvideos",
        let: { videoId: videoId, cropId: cropId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$videoId", "$$videoId"] },
                  { $eq: ["$cropId", "$$cropId"] },
                ],
              },
            },
          },
        ],
        as: "existingCropVideo",
      },
    },
    {
      $unwind: { path: "$existingCropVideo", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        videoExists: {
          $cond: [{ $gt: [{ $size: "$video" }, 0] }, true, false],
        },
        cropExists: { $cond: [{ $gt: [{ $size: "$crop" }, 0] }, true, false] },
        videoAlreadyLinked: {
          $cond: [{ $ne: ["$existingCropVideo", null] }, true, false],
        },
      },
    },
  ]);

  if (result.length === 0) {
    throw new ApiError(404, "Video or crop not found");
  }

  const { videoExists, cropExists, videoAlreadyLinked } = result[0];

  if (!videoExists || !cropExists) {
    throw new ApiError(404, "Unauthorized request or video/crop not found");
  }

  if (videoAlreadyLinked) {
    throw new ApiError(400, "Video already uploaded to crop");
  }

  await CropVideo.create({ cropId, videoId });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video linked to crop successfully"));
});

const deleteVideoFromCropVideo = asyncHandler(async (req, res) => {
  // Get the video id from the request params
  // Get the crop id from the request body
  // Check if the video id is provided
  // Check if the crop id is provided
  // Find the crop video document from the database
  // Check if the crop video document exists
  // Delete the crop video document from the database
  // Send the response

  const videoId = req.params?.id;
  const { cropId } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video id is missing");
  }

  if (!cropId) {
    throw new ApiError(400, "Crop id is missing");
  }

  const result = await CropVideo.findOneAndDelete({
    videoId,
    cropId,
  });

  if (!result) {
    throw new ApiError(404, "Video not linked to crop");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video unlinked from crop successfully"));
});

export {
  uploadVideo,
  deleteVideo,
  getAllVideos,
  getVideoById,
  uploadVideoToCropVideo,
  deleteVideoFromCropVideo,
};
