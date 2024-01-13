import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const newId = "video/" + videoId;
    const VideoId = await Video.findOne({ videoPublicId: newId })
    const isLiked = await Like.findOne({
        $and: [{
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
            video: VideoId._id
        }]
    })
    if (!isLiked) {
        const Liked = await Like.create({
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
            video: VideoId._id
        })
        if (!Liked) {
            throw new ApiError(510, "Something went wrong while Liking the video");
        }
        return res.status(200).json(
            new ApiResponse(200, {}, "Liked Successfully")
        )
    }
    else {
        await Like.findByIdAndDelete(isLiked._id);
        return res.status(200).json(
            new ApiResponse(200, {}, "Unliked Successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const commentExists = await Comment.findOne({ _id: commentId });
    if (!commentExists) {
        throw new ApiError(420, "Comment Does Not Exists")
    }
    const isLiked = await Like.findOne({
        $and: [{
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
            comment: commentId
        }]
    })
    if (!isLiked) {
        const Liked = await Like.create({
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
            comment: commentId
        })
        if (!Liked) {
            throw new ApiError(510, "Something went wrong while Liking the Comment");
        }
        return res.status(200).json(
            new ApiResponse(200, {}, "Liked Successfully")
        )
    }
    else {
        await Like.findByIdAndDelete(isLiked._id);
        return res.status(200).json(
            new ApiResponse(200, {}, "Unliked Successfully")
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const tweetExists = await Tweet.findOne({ _id: tweetId });
    if (!tweetExists) {
        throw new ApiError(420, "Tweet Does Not Exists")
    }
    const isLiked = await Like.findOne({
        $and: [{
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
            tweet: tweetId
        }]
    })
    if (!isLiked) {
        const Liked = await Like.create({
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
            tweet: tweetId
        })
        if (!Liked) {
            throw new ApiError(510, "Something went wrong while Liking the Tweet");
        }
        return res.status(200).json(
            new ApiResponse(200, {}, "Liked Successfully")
        )
    }
    else {
        await Like.findByIdAndDelete(isLiked._id);
        return res.status(200).json(
            new ApiResponse(200, {}, "Unliked Successfully")
        )
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const LikedVideos = await Like.aggregate(
        [
            {
                $match: {
                    $and: [
                        {
                            likedBy: new mongoose.Types.ObjectId(req.user?._id),
                        },
                        {
                            video: {
                                $exists: true,
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "videoInfo",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "ownerInfo",
                                pipeline: [
                                    {
                                        $project: {
                                            username: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                ownerInfo: {
                                    $first: "$ownerInfo"
                                }
                            }
                        },
                        {
                            $project: {
                                duration: 1,
                                title: 1,
                                videoFile: 1,
                                ownerInfo: 1,
                                view: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    videoInfo: {
                        $first: "$videoInfo"
                    }
                }
            }
        ]
    )
    if (!LikedVideos?.length) {
        throw new ApiError(405, "No Liked Videos")
    }
    return res.status(200).json(
        new ApiResponse(200, LikedVideos, "Liked Videos Fetched Successfully")
    )
})

const getLikedComments = asyncHandler(async (req, res) => {
    const LikedComments = await Like.aggregate(
        [
            {
                $match: {
                    $and: [
                        {
                            likedBy: new mongoose.Types.ObjectId(req.user?._id),
                        },
                        {
                            comment: {
                                $exists: true,
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "comment",
                    foreignField: "_id",
                    as: "LikedCommentInfo",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "CommentOwnerInfo",
                                pipeline: [
                                    {
                                        $project: {
                                            avatar: 1,
                                            username: 1,
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            $addFields: {
                                CommentOwnerInfo: {
                                    $first: "$CommentOwnerInfo",
                                },
                            },
                        },
                        {
                            $project: {
                                content: 1,
                                CommentOwnerInfo: 1
                            }
                        }
                    ],
                },
            },
            {
                $addFields: {
                    LikedCommentInfo: {
                        $first: "$LikedCommentInfo"
                    }
                }
            },
            {
                $project: {
                    LikedCommentInfo: 1
                }
            }
        ]
    )
    if (!LikedComments?.length) {
        throw new ApiError(405, "No Liked Comments")
    }
    return res.status(200).json(
        new ApiResponse(200, LikedComments, "Liked Comments Fetched Successfully")
    )
})

const getLikedTweet = asyncHandler(async (req, res) => {
    const LikedTweets = await Like.aggregate(
        [
            {
                $match: {
                    $and: [
                        {
                            likedBy: new mongoose.Types.ObjectId(req.user?._id),
                        },
                        {
                            tweet: {
                                $exists: true,
                            },
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: "tweets",
                    localField: "tweet",
                    foreignField: "_id",
                    as: "LikedTweetInfo",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "TweetOwnerInfo",
                                pipeline: [
                                    {
                                        $project: {
                                            avatar: 1,
                                            username: 1,
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            $addFields: {
                                TweetOwnerInfo: {
                                    $first: "$TweetOwnerInfo",
                                },
                            },
                        },
                        {
                            $project: {
                                content: 1,
                                TweetOwnerInfo: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    LikedTweetInfo: {
                        $first: "$LikedTweetInfo",
                    },
                },
            },
            {
                $project: {
                    LikedTweetInfo: 1,
                },
            },
        ]
    )
    if (!LikedTweets?.length) {
        throw new ApiError(405, "No Liked Tweets")
    }
    return res.status(200).json(
        new ApiResponse(200, LikedTweets, "Liked Tweets Fetched Successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedComments,
    getLikedTweet
}