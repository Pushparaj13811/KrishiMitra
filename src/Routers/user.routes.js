import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserBio,
  updateUserCoverImage,
  updateUserLanguage,
  refreshAccessToken,
} from "../Controllers/user.controller.js";
import { upload } from "../Middlewares/multer.middleware.js";
import { verifyJwt } from "../Middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secure routes

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/getuser").get(verifyJwt, (req, res) => {
  res.json(req.user);
});

router.route("/refreshtoken").post(verifyJwt, refreshAccessToken);

router.route("/changepassword").patch(verifyJwt, changeCurrentPassword);

router.route("/updateaccount").patch(verifyJwt, updateAccountDetails);
router
  .route("/updateavatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);

router.route("/updatebio").patch(verifyJwt, updateUserBio);
router
  .route("/updatecoverimage")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

router.route("/updatelanguage").patch(verifyJwt, updateUserLanguage);

export default router;
