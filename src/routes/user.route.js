import {Router} from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, newAccessAndRefreshToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount : 1
        } 
    ])
    ,registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(newAccessAndRefreshToken);

// Secure routes

router.route("/logout").put(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/watch-history").get(verifyJWT, getWatchHistory);
router.route("/change-password").put(verifyJWT, changeCurrentPassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/channel/:userName").get(verifyJWT, getUserChannelProfile);
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/update-coverimage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

export default router; 