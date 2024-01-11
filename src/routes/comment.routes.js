import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").post(addComment);
router.route("/comment/:commentId").delete(deleteComment)
router.route("/comment/:commentId").patch(updateComment);
router.route("/:videoId").get(getVideoComments)
export default router