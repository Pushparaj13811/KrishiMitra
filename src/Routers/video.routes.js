import { Router } from "express";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  deleteVideo,
} from "../Controllers/video.controller.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";
import { upload } from "../Middlewares/multer.middleware.js";

const router = Router();

router.route("/get-all-videos").get(getAllVideos);
router.route("/get-video/:videoId").get(getVideoById);
router
  .route("/upload-video")
  .post(verifyJwt, upload.single("video"), uploadVideo);
// router.route("/update-video/:videoId").patch(verifyJwt, updateVideo);
router.route("/delete-video/:videoId").delete(verifyJwt, deleteVideo);

export default router;
