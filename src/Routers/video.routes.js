import { Router } from "express";
import {
  createVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
} from "../Controllers/video.controller.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";
import { upload } from "../Middlewares/multer.middleware.js";

const router = Router();

router.route("/get-all-videos").get(getAllVideos);
router.route("/get-video/:videoId").get(getVideoById);
router
  .route("/create-video")
  .post(verifyJwt, upload.single("video"), createVideo);
router.route("/update-video/:videoId").patch(verifyJwt, updateVideo);
router.route("/delete-video/:videoId").delete(verifyJwt, deleteVideo);

export default router;
