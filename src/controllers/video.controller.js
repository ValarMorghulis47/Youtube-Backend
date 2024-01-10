import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { DeleteFileCloudinary } from "../utils/DeleteFileCloudinary.js"
import { DeleteVideoCloudinary } from "../utils/DeleteVideoCloudinary.js"

const publishAVideo = asyncHandler(async (req, res)=>{
    const { title, description} = req.body
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }
    const existedVideo = await Video.findOne({title})
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
    const videores = await uploadOnCloudinary(videoLocalPath , videoFolder);
    console.log(videores);
    if (!videores) {
        throw new ApiError(408, "Error while uploading video file on cloudinary");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath , thumbnailFolder);
    if (!thumbnail) {
        throw new ApiError(408, "Error while uploading thumbnail file on cloudinary");
    }
    const video = await Video.create({
        videoFile : videores.url,
        thumbnail: thumbnail.url,
        title: title,
        description: description,
        duration : videores.duration,
        owner : req.user?._id,
        videoPublicId : videores.public_id,
        thumbnailPublicId : thumbnail.public_id
    })
    const createdVideo = await Video.findById(video._id)
    if (!createdVideo) {
        throw new ApiError(501, "Something went wrong while uploading the video");
    }
    return res.status(200).json(
        new ApiResponse(200, createdVideo, "Video Published Successfully")
    )
})

const updateVideo = asyncHandler(async (req, res)=>{
    const {videoId} = req.params;
    const newVideoId = "video/"+videoId;
    const {title, description} = req.body;
    const previousThumbnailPublicId = await Video.findOne({videoPublicId: newVideoId}).select("thumbnailPublicId");
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
    console.log(thumbnail);
    if (!thumbnail) {
        throw new ApiError(408, "Error while uploading thumbnail file on cloudinary");
    }
    const updatedVideo = await Video.findOneAndUpdate({thumbnailPublicId : newId}, {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
        thumbnailPublicId : thumbnail.public_id
    },{
        new: true
    }).select("-videoPublicId -thumbnailPublicId -owner")
    if (newId) {
        await DeleteFileCloudinary(newId , folder);
    }
    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video Updated Successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res)=>{
    const {videoId} = req.params;
    const newVideoId = "video/"+videoId;
    const Video_Id = await Video.findOne({videoPublicId: newVideoId}).select("_id videoPublicId thumbnailPublicId");
    if (!Video_Id) {
        throw new ApiError(404, "Video Not Found");
    }
    const folder = "video";
    const thumbnail = "thumbnail";
    await DeleteVideoCloudinary(Video_Id.videoPublicId , folder);
    await DeleteFileCloudinary(Video_Id.thumbnailPublicId , thumbnail);
    await Video.findByIdAndDelete(Video_Id._id);
    return res.status(200).json(
        new ApiResponse(200, {}, "Video Deleted Successfully")
    )
})

export {
    // getAllVideos,
    publishAVideo,
    // getVideoById,
    updateVideo,
    deleteVideo,
    // togglePublishStatus
}