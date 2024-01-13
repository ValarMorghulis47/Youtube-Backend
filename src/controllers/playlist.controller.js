import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import ApiError from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if ([name, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }
    const playlist = await Playlist.create({
        name: name?.trim(),
        description: description?.trim(),
        owner: req.user?._id
    })
    if (!playlist) {
        throw new ApiError(505, "Something went wrong while creating a playlist");
    }
    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist Created Successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(400, "User Does Not Exist")
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid ObjectId")
    }
    const playlists = await Playlist.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $addFields: {
                    TotalVideo: {
                        $size: "$videos"
                    },
                    FirstVideo: {
                        $first: "$videos"
                    }
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "FirstVideo",
                    foreignField: "_id",
                    as: "FirstVideoDetails",
                    pipeline: [
                        {
                            $project: {
                                thumbnail: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    FirstVideoDetails: {
                        $first: "$FirstVideoDetails"
                    }
                }
            },
            {
                $project: {
                    FirstVideoDetails: 1,
                    name: 1,
                    TotalVideo: 1,
                }
            }
        ]
    )
    if (!playlists?.length) {
        throw new ApiError(406, "No Playlists Found")
    }
    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists Found Successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid ObjectId")
    }
    const validPlaylist = await Playlist.findById(playlistId);
    if (!validPlaylist) {
        throw new ApiError(404, "Playlist Not Found");
    }
    const playlistDetails = await Playlist.aggregate(
        [
            {
              $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
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
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                  {
                    $project:{
                      videoFile:1,
                      duration:1,
                      view:1,
                      thumbnail:1,
                      title:1,
                      createdAt:1
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                TotalVideos: {
                  $size: "$videos"
                }
              }
            },
            {
              $project: {
                name:1,
                description:1,
                updatedAt:1,
                ownerDetails:1,
                videoDetails:1,
                TotalVideos:1
              }
            }
          ]
    )
    if (!playlistDetails?.length) {
        throw new ApiError(430, "Add Some Videos In The Playlist");
    }
    return res.status(200).json(
        new ApiResponse(200, playlistDetails, "Playlist Details Found Successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // if (!isValidObjectId(playlistId) ||!isValidObjectId(videoId)) {
    //     throw new ApiError(400, "Invalid ObjectId")
    // }
    const newId = "video/" + videoId;
    const video = await Video.findOne({ videoPublicId: newId }).select("_id");
    if (!video) {
        throw new ApiError(404, "Video Does Not Exists");
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found");
    }
    const videoExists = await Playlist.findOne({ videos: video, _id: playlistId })
    if (videoExists) {
        throw new ApiError(420, "Video Already Exists In The Playlist")
    }
    playlist.videos.push(video);
    const save = await playlist.save();
    if (!save) {
        throw new ApiError(505, "Something went wrong while adding a video to the playlist");
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Video Added To Playlist Successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const newId = "video/" + videoId;
    const video = await Video.findOne({ videoPublicId: newId }).select("_id");

    if (!video) {
        throw new ApiError(404, "Video Does Not Exist");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found");
    }

    // Check if the video exists in the playlist
    const videoIndex = playlist.videos.indexOf(video._id);

    if (videoIndex === -1) {
        throw new ApiError(420, "Video Does Not Exist In The Playlist");
    }

    // Use $pull to remove the video from the playlist
    playlist.videos.splice(videoIndex, 1);

    // Save the updated playlist
    const save = await playlist.save();
    if (!save) {
        throw new ApiError(505, "Something went wrong while removing a video to the playlist");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Video Deleted From The Playlist Successfully")
    );
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found");
    }
    const deleteRespons = await Playlist.findByIdAndDelete(playlist._id);
    if (!deleteRespons) {
        throw new ApiError(505, "Something went wrong while deleting a playlist");
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist Deleted Successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist Not Found");
    }
    if ([name, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required");
    }
    const result = await Playlist.findByIdAndUpdate(playlistId, {
        $set: {
            name: name?.trim(),
            description: description?.trim()
        }
    }, {
        new: true
    })
    if (!result) {
        throw new ApiError(505, "Something went wrong while updating a playlist");
    }
    return res.status(200).json(
        new ApiResponse(200, result, "Playlist Updated Successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}