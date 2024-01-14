import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { DeleteFileCloudinary } from "../utils/DeleteFileCloudinary.js"
import { DeleteVideoCloudinary } from "../utils/DeleteVideoCloudinary.js"

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }
    const existedVideo = await Video.findOne({ title })
    if (existedVideo?.title === title) {
        throw new ApiError(408, "Video Already Exists");
    }
    let videoLocalPath;
    if (req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0) {
        videoLocalPath = req.files.videoFile[0].path
    }
    else {
        throw new ApiError(408, "Video File Is Required");
    }
    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path
    }
    else {
        throw new ApiError(408, "Thumbnail File Is Required");
    }
    const videoFolder = "video";
    const thumbnailFolder = "thumbnail";
    const videores = await uploadOnCloudinary(videoLocalPath, videoFolder);
    if (!videores) {
        throw new ApiError(408, "Error while uploading video file on cloudinary");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, thumbnailFolder);
    if (!thumbnail) {
        throw new ApiError(408, "Error while uploading thumbnail file on cloudinary");
    }
    const video = await Video.create({
        videoFile: videores.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        duration: videores.duration,
        owner: req.user?._id,
        videoPublicId: videores.public_id,
        thumbnailPublicId: thumbnail.public_id
    })
    const createdVideo = await Video.findById(video._id)
    if (!createdVideo) {
        throw new ApiError(501, "Something went wrong while uploading the video");
    }
    return res.status(200).json(
        new ApiResponse(200, createdVideo, "Video Published Successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const newVideoId = "video/" + videoId;
    const { title, description } = req.body;
    const previousThumbnailPublicId = await Video.findOne({ videoPublicId: newVideoId }).select("thumbnailPublicId");
    const newId = previousThumbnailPublicId.thumbnailPublicId;
    if (!(title && description)) {
        throw new ApiError(410, "All Fields Are Required");
    }
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(408, "Thumbnail File Is Required");
    }
    const folder = "thumbnail"
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, folder);
    if (!thumbnail) {
        throw new ApiError(408, "Error while uploading thumbnail file on cloudinary");
    }
    const updatedVideo = await Video.findOneAndUpdate({ thumbnailPublicId: newId }, {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
        thumbnailPublicId: thumbnail.public_id
    }, {
        new: true
    }).select("-videoPublicId -thumbnailPublicId -owner")
    if (newId) {
        await DeleteFileCloudinary(newId, folder);
    }
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video Updated Successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const newVideoId = "video/" + videoId;
    const Video_Id = await Video.findOne({ videoPublicId: newVideoId }).select("_id videoPublicId thumbnailPublicId owner");
    if (!Video_Id) {
        throw new ApiError(404, "Video Not Found");
    }
    console.log(Video_Id.owner);
    console.log(req.user?._id);
    if (Video_Id.owner === req.user?._id) {
        throw new ApiError(403, "You are not the owner of this video to delete it");
    }
    const folder = "video";
    const thumbnail = "thumbnail";
    await DeleteVideoCloudinary(Video_Id.videoPublicId, folder);
    await DeleteFileCloudinary(Video_Id.thumbnailPublicId, thumbnail);
    await Video.findByIdAndDelete(Video_Id._id);
    await Like.deleteMany({video: Video_Id._id})
    await Comment.deleteMany({video: Video_Id._id})
    return res.status(200).json(
        new ApiResponse(200, {}, "Video Deleted Successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const user = await User.findById(req.user?._id);
    const newVideoId = "video/" + videoId;
    const videoExists = await Video.findOne({ videoPublicId: newVideoId }).select("_id")
    if (!videoExists) {
        throw new ApiError(404, "Video Not Found");
    }
    const videoExistsHistory = await User.findOne({ watchHistory: videoExists._id });
    if (videoExistsHistory) {
        throw new ApiError(404, "Video Is Already In the history");
    }
    user.watchHistory.push(videoExists);
    const save = await user.save();
    if (!save) {
        throw new ApiError(505, "Something went wrong while adding a video to the playlist");
    }
    await Video.findByIdAndUpdate(videoExists._id, {
        $inc: { view: 1 }
    })
    const video = await Video.aggregate([
        {
            $match: {
                _id: videoExists._id,
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
                    $first: "$ownerDetails",
                },
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subsCount: {
                    $size: "$subscribers",
                },
                subedTo: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                "$subscribers.subscriber",
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "Likes"
            }
        },
        {
            $addFields: {
                TotalLikes: {
                    $size: "$Likes"
                },
            }
        },
        {
            $project: {
                subedTo: 1,
                ownerDetails: 1,
                subsCount: 1,
                TotalLikes: 1,
                title: 1,
                description: 1,
                isSubscribed: 1,
                view: 1,
                createdAt: 1
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(200, video, "Video Fetched Successfully")
    )
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    // Start with a base pipeline
    let pipeline = [
        {
            $match: {
                $or: [
                    {
                        owner: new mongoose.Types.ObjectId(userId) // Use provided userId or default
                    },
                    {
                        $or: [
                            {
                                title: {
                                    $regex: query ? query : "", // Use provided query or empty string
                                    $options: "i",
                                },
                            },
                            {
                                description: {
                                    $regex: query ? query : "", // Use provided query or empty string
                                    $options: "i",
                                },
                            },
                        ],
                    },
                ],
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

const togglePublishStatus = asyncHandler(async (req, res)=>{
    const {videoId} = req.params;
    const newId = "video/"+videoId;
    const videoExists = await Video.findOne({ videoPublicId: newId });
    if (!videoExists) {
        throw new ApiError(404, "Video Not Found");
    }
    videoExists.isPublished =!videoExists.isPublished;
    const save = await videoExists.save({ validateBeforeSave: false });
    if (!save) {
        throw new ApiError(505, "Something went wrong while publishing a video");
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Published Status Changed Successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}