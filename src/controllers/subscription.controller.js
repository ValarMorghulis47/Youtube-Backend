import mongoose, { Mongoose, isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscriptions.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const isSubcribed = await Subscription.findOne({
        $and: [{
            subscriber: new mongoose.Types.ObjectId(req.user?._id),
            channel: new mongoose.Types.ObjectId(channelId)
        }]
    })
    if (!isSubcribed) {
        const subscribed = await Subscription.create({
            subscriber: new mongoose.Types.ObjectId(req.user?._id),
            channel: new mongoose.Types.ObjectId(channelId)
        })
        if (!subscribed) {
            throw new ApiError(410, "Something went wrong while subscribing the channel");
        }
        return res.status(200).json(
            new ApiResponse(200, {}, "Subscribed Successfully")
        )
    }
    else {
        await Subscription.findByIdAndDelete(isSubcribed._id);
        return res.status(200).json(
            new ApiResponse(200, {}, "Unsubscribed Successfully")
        )
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const SubscribersNumber = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribers: {
                    $size: "$subscribers"
                }
            }
        },
        {
            $project: {
                subscribers: 1
            }
        }
    ])
    if (!SubscribersNumber?.length) {
        throw new ApiError(404, "Channel Not Found");
    }
    return res.status(200).json(
        new ApiResponse(200, SubscribersNumber, "Subscribers Number Fetched Successfully")
    )
})

const getSubscribedChannels = asyncHandler(async (req, res)=>{
    const SubscribersNumber = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "ChannelSubTo"
            }
        },
        {
            $addFields: {
                ChannelSubTo: {
                    $size: "$ChannelSubTo"
                }
            }
        },
        {
            $project: {
                ChannelSubTo: 1
            }
        }
    ])
    if (!SubscribersNumber?.length) {
        throw new ApiError(404, "Channel Not Found");
    }
    return res.status(200).json(
        new ApiResponse(200, SubscribersNumber, "Channel Subscribed Number Fetched Successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}