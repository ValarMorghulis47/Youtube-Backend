import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const newId = "video/"+videoId;
    const { page = 1, limit = 10 } = req.query
    const result = await Video.findOne({
        videoPublicId: newId
    })
    if (!result) {
        throw new ApiError(404, "Video Not Found");
    }
    const skip = (page - 1) * limit;
    const AllComments = await Video.aggregate([
        {
            $match: {
                videoPublicId: newId
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerData",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            ownerData: {
                                $arrayElemAt: ["$ownerData", 0]
                            }
                        }
                    },
                    {
                        $addFields: {
                            username: "$ownerData.username",
                            avatar: "$ownerData.avatar"
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            content: 1
                        }
                    }
                ]
            },
        },
        {
            $addFields: {
                TotalComments: {
                    $size: "$comments"
                }
            }
        },
        {
            $project: {
              TotalComments:1,
              comments:{
                $slice: ["$comments", skip, parseInt(limit)]
            }
            }
        }
    ])
    if (!AllComments?.length) {
        throw new ApiError(404, "Channel Not Found");
    }
    return res.status(200).json(
        new ApiResponse(200, AllComments, "Comments Fetched Successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    if ([content].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Content is Required");
    }
    const newId = "video/" + videoId;
    const video = await Video.findOne({ videoPublicId: newId });
    if (!video) {
        throw new ApiError(404, "Video Not Found");
    }
    const comment = await Comment.create({
        video: video._id,
        owner: req.user?._id,
        content: content
    })
    if (!comment) {
        throw new ApiError(501, "Something went wrong while creating a comment");
    }
    return res.status(200).json(
        new ApiResponse(200, comment, "Comment Created Successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    if ([content].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Content is Required");
    }
    const check = await Comment.findOne({
        $and: [
            {
                _id: new mongoose.Types.ObjectId(commentId),
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        ]
    })
    if (!check) {
        throw new ApiError(404, "Comment Not Found");
    }
    const comment = await Comment.findByIdAndUpdate(commentId, {
        $set: {
            content: content
        }
    },
        {
            new: true
        })
    if (!comment) {
        throw new ApiError(501, "Something went wrong while updating a comment");
    }
    return res.status(200).json(
        new ApiResponse(200, comment, "Comment Updated Successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const check = await Comment.findOne({
        $and: [
            {
                _id: new mongoose.Types.ObjectId(commentId),
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        ]
    })
    if (!check) {
        throw new ApiError(404, "Comment Not Found");
    }
    const comment = await Comment.findByIdAndDelete(commentId)
    if (!comment) {
        throw new ApiError(501, "Something went wrong while deleting a comment");
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Comment Deleted Successfully")
    )
})

export {
    getVideoComments, 
    addComment,
    updateComment,
    deleteComment
}