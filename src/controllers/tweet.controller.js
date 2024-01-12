import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if ([content].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    });
    if (!tweet) {
        throw new ApiError(507, "Something went wrong while creating a tweet");
    }
    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet Created Successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User Not Found");
    }
    const tweets = await Tweet.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerData",
                    pipeline: [
                        {
                            $project: {
                                avatar: 1,
                                username: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    ownerData: {
                        $first: "$ownerData"
                    },

                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]
    )
    if (!tweets?.length) {
        throw new ApiError(404, "Tweets Not Found");
    }
    console.log(tweets);
    return res.status(200).json(
        new ApiResponse(200, tweets, "Tweets Fetched Successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const {content} = req.body;
    console.log(content);
    const tweetexists = await Tweet.findById(tweetId);
    if (!tweetexists) {
        throw new ApiError(404, "Tweet Not Found");
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content
        }
    }, {
        new: true
    })
    if (!updatedTweet) {
        throw new ApiError(507, "Something went wrong while Updating a tweet");
    }
    return res.status(200).json(
        new ApiResponse(200, updatedTweet, "Tweet Updated Successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const tweetexists = await Tweet.findById(tweetId);
    if (!tweetexists) {
        throw new ApiError(404, "Tweet Not Found");
    }
    if (tweetexists.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "You are not authorized to delete this tweet");
    }
    const DeleteTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!DeleteTweet) {
        throw new ApiError(507, "Something went wrong while Deleting a tweet");
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet Deleted Successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}