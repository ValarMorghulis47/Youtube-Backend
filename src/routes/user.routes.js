import { Router } from "express";
import {changeCurrentPassword, getCurrentUser, getUserChannelProfile, getUserWatchHistory, loginUser, logoutUser, refereshAccessToken, registerUser, upDateUserDetails, updateUserAvatar, updateUserCoverImage} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser);
//secured routes
router.route("/logout").get(verifyJWT , logoutUser);
router.route("/refresh-token").post(refereshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/currentuser").get(verifyJWT , getCurrentUser)
router.route("/update-account").patch(verifyJWT , upDateUserDetails)
router.route("/update-avatar").patch(verifyJWT , upload.single("avatar") , updateUserAvatar)
router.route("/update-coverimage").patch(verifyJWT , upload.single("coverimage") , updateUserCoverImage)
router.route("/channel/:username").get(verifyJWT , getUserChannelProfile)
router.route("/history").get(verifyJWT , getUserWatchHistory)


export default router;