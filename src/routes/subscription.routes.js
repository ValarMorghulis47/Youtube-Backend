import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/channel/:channelId").post(toggleSubscription);
router.route("/subscribernumber/:channelId").get(getUserChannelSubscribers);
router.route("/channelssubto").get(getSubscribedChannels);

export default router