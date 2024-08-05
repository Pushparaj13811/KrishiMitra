import { Router } from "express";
import {
  getCropData,
  uploadCropData,
  deleteCropData,
  getAllCrops,
  updateCropData,
  addCropImages,
  deleteCropImages,
} from "../Controllers/crop.controller.js";

import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";

const router = Router();

router.route("/get-all-crops").get(getAllCrops);
router.route("/get-crop/:cropId").get(getCropData);
router.route("/create-crop").post(
  verifyJwt,
  upload.fields([
    {
      name: "images",
      maxCount: 5,
      minCount: 3,
    },
  ]),
  uploadCropData
);
router.route("/update-crop/:cropId").patch(verifyJwt, updateCropData);
router.route("/delete-crop/:cropId").delete(verifyJwt, deleteCropData);
router.route("/add-crop-images/:cropId").patch(
  verifyJwt,
  upload.fields([
    {
      name: "images",
      maxCount: 5,
      minCount: 3,
    },
  ]),
  addCropImages
);
router
  .route("/delete-crop-images/:cropId/:imageId")
  .delete(verifyJwt, deleteCropImages);

export default router;
