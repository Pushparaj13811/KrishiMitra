import { Router } from "express";
import { aiCropDignosis, deleteImage, getDiagnosticHistory, getDiagnosticHistoryById } from "../Controllers/ai.controller.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";
import { upload } from "../Middlewares/multer.middleware.js";

const router = Router();

router.route("/crop-dignosis").post(
  verifyJwt,
  upload.fields([
    {
      name: "cropimage",
      maxCount: 1,
    }
  ]),
  aiCropDignosis
);

router.route("/history").get(verifyJwt, getDiagnosticHistory);
router.route("/history/:id").get(verifyJwt, getDiagnosticHistoryById);
router.route("/history/delete").delete(verifyJwt, deleteImage);
export default router;
