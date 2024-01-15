import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
// import { Subscription } from "../models/subscription.model.js"
// import { Like } from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // let pipeline = [
    //     {
    //         $match: {
    //             _id: new mongoose.Types.ObjectId(req.user?._id)
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             localField: "_id",
    //             foreignField: "owner",
    //             as: "videoDetails"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "tweets",
    //             localField: "_id",
    //             foreignField: "owner",
    //             as: "tweetDetails"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "comments",
    //             localField: "_id",
    //             foreignField: "owner",
    //             as: "commentDetails"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "likes",
    //             localField: "_id",
    //             foreignField: "likedBy",
    //             as: "likeDetails"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "subscriptions",
    //             localField: "_id",
    //             foreignField: "channel",
    //             as: "subsDetails"
    //         }
    //     },
    //     {
    //         $addFields: {
    //             TotalTweets: {
    //                 $size: "$tweetDetails"
    //             },
    //             TotalComment: {
    //                 $size: "$commentDetails"
    //             },
    //             TotalLikes: {
    //                 $size: "$likeDetails"
    //             },
    //             TotalSubs: {
    //                 $size: "$subsDetails"
    //             },
    //             TotalVideos: {
    //                 $size: "$videoDetails"
    //             }
    //         }
    //     },
    // ]
    let pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videoDetails"
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweetDetails"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "owner",
                as: "commentDetails"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "likedBy",
                as: "likeDetails"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subsDetails"
            }
        },
        {
            $addFields: {
                TotalTweets: { $size: "$tweetDetails" },
                TotalComment: { $size: "$commentDetails" },
                TotalLikes: { $size: "$likeDetails" },
                TotalSubs: { $size: "$subsDetails" },
                TotalVideos: { $size: "$videoDetails" }
            }
        },
        {
            $facet: {
                zeroVideos: [
                    {
                        $match: {
                            TotalVideos: 0
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            TotalTweets: { $first: "$TotalTweets" },
                            TotalComment: { $first: "$TotalComment" },
                            TotalLikes: { $first: "$TotalLikes" },
                            TotalSubs: { $first: "$TotalSubs" },
                            TotalVideo: { $first: "$TotalVideos" },
                            TotalViews: { $sum: "$videoDetails.view" }
                        }
                    }
                ],
                nonZeroVideos: [
                    {
                        $match: {
                            TotalVideos: { $gt: 0 }
                        }
                    },
                    {
                        $unwind: {
                            path: "$videoDetails",
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            TotalTweets: { $first: "$TotalTweets" },
                            TotalComment: { $first: "$TotalComment" },
                            TotalLikes: { $first: "$TotalLikes" },
                            TotalSubs: { $first: "$TotalSubs" },
                            TotalVideo: { $first: "$TotalVideos" },
                            TotalViews: { $sum: "$videoDetails.view" }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                result: { $concatArrays: ["$zeroVideos", "$nonZeroVideos"] }
            }
        },
        {
            $unwind: "$result"
        },
        {
            $replaceRoot: { newRoot: "$result" }
        }
    ];
    // if (pipeline[TotalVideos]===0) {
    //     console.log("i am in if");
    //     let groupStage = {
    //         $group: {
    //             _id: "$_id",
    //             TotalViews: {
    //                 $sum: "$videoDetails.view"
    //             },
    //             TotalTweets: {
    //                 $first: "$TotalTweets"
    //             },
    //             TotalComment: {
    //                 $first: "$TotalComment"
    //             },
    //             TotalLikes: {
    //                 $first: "$TotalLikes"
    //             },
    //             TotalSubs: {
    //                 $first: "$TotalSubs"
    //             },
    //             TotalVideo: {
    //                 $first: "$TotalVideos"
    //             },
    //         }
    //     }
    //     pipeline.push(groupStage);
    // } else {
    //     console.log("i am in else");
    //     let unwindStage = {
    //         $unwind: {
    //             path: "$videoDetails",
    //         }
    //     }
    //     pipeline.push(unwindStage);
    //     let groupStage = {
    //         $group: {
    //             _id: "$_id",
    //             TotalViews: {
    //                 $sum: "$videoDetails.view"
    //             },
    //             TotalTweets: {
    //                 $first: "$TotalTweets"
    //             },
    //             TotalComment: {
    //                 $first: "$TotalComment"
    //             },
    //             TotalLikes: {
    //                 $first: "$TotalLikes"
    //             },
    //             TotalSubs: {
    //                 $first: "$TotalSubs"
    //             },
    //             TotalVideo: {
    //                 $first: "$TotalVideos"
    //             },
    //         }
    //     }
    //     pipeline.push(groupStage);
    // }
    const channelStats = await User.aggregate(pipeline);
    return res.status(200).json(
        new ApiResponse(200, channelStats, "Channel Stats Fetched Successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy, sortType, userId } = req.query;
    // Start with a base pipeline
    console.log(userId);
    let pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id) // Use provided userId or default
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                ownerDetails: {
                    $arrayElemAt: ["$ownerDetails", 0],
                },
            },
        },
        {
            $project: {
                ownerDetails: 1,
                createdAt: 1,
                view: 1,
                title: 1,
                videoFile: 1,
                thumbnail: 1,
            },
        },
    ];

    // Add sorting stage based on sortBy and sortType
    if (sortBy && sortType) {
        let sortStage = {
            $sort: {
                [sortBy]: sortType.toLowerCase() === 'desc' ? -1 : 1,
            },
        };
        pipeline.push(sortStage);
    } else {
        // Default sorting by createdAt in ascending order if sortBy and sortType are not provided
        pipeline.push({
            $sort: {
                createdAt: 1,
            },
        });
    }

    // Add pagination stages
    let skipStage = { $skip: (page - 1) * limit };
    let limitStage = { $limit: limit };
    pipeline.push(skipStage, limitStage);

    // Execute the pipeline
    const videos = await Video.aggregate(pipeline);
    if (!videos?.length) {
        throw new ApiError(430, "No Videos Found")
    }
    // Return the result to the client
    return res.status(200).json(
        new ApiResponse(200, videos, "Videos Fetched Successfully")
    )
})

export {
    getChannelStats,
    getChannelVideos
}