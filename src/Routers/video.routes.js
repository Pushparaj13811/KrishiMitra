import { Router } from "express";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  deleteVideo,
  uploadVideoToCropVideo,
  deleteVideoFromCropVideo,
} from "../Controllers/video.controller.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";
import { upload } from "../Middlewares/multer.middleware.js";

const router = Router();

router.route("/get-all-videos").get(getAllVideos);
router.route("/get-video/:videoId").get(getVideoById);
router
  .route("/upload-video")
  .post(verifyJwt, upload.single("video"), uploadVideo);
router.route("/link-video-to-crop/:id").post(verifyJwt, uploadVideoToCropVideo);
router
  .route("/unlink-video-from-crop/:id")
  .delete(verifyJwt, deleteVideoFromCropVideo);
router.route("/delete-video/:videoId").delete(verifyJwt, deleteVideo);

export default router;
