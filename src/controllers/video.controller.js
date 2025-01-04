import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { getFilePublicId } from "../utils/GetPublicId.js"
import { Playlist } from "../models/Playlist.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const videoExist = await Video.findById(videoId);
    if (!videoExist || (req.user._id !== videoExist.owner && videoExist.isPublished === false)) throw new ApiError(404, "No video exist for this id"); // Need to check this part (may be)

    await User.findByIdAndUpdate(req.user._id,
        {
            $push: {watchHistory: videoId}
        }
    )

    return res.status(200).json(
        new ApiResponse(200, "Video fetched successfully", videoExist)
    );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    // Try to settle the textual data here , for video create a another controller

    const videoExist = await Video.findById(videoId);
    if (!videoExist) throw new ApiError(404, "No video exist for this id");

    const { title, description, isPublished } = req.body;
    if (!title && !description && !isPublished) {
        throw new ApiError(400, "Provide atleast one field to update");
    }

    const updateOptions = {};
    if (title) updateOptions.title = title;
    if (description) updateOptions.description = description;
    if (isPublished) updateOptions.isPublished = isPublished;

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: updateOptions
    }, { new: true });

    return res.status(200).json(
        new ApiResponse(200, "Video details are now updated", updatedVideo)
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const videoExist = await Video.findById(videoId);

    if(!videoExist) throw new ApiError(404, "No video exist for this id");
    if(videoExist.owner !== req.user._id) throw new ApiError(403, "You are not the owner of video");

    // Need to delete cloudinary files
    const videoFileDeleteCloudinary = await deleteFromCloudinary(getFilePublicId(videoExist.videoFile), "video");
    const thumbnailFileDeleteCloudinary = await deleteFromCloudinary(getFilePublicId(videoExist.thumbnail), "image");

    console.log("This is video file delete response = ", videoFileDeleteCloudinary);
    console.log("This is thumbnail file delete response = ", thumbnailFileDeleteCloudinary);

    const playlistExist = await Playlist.find({owner: videoExist.owner});
    for(let playlist of playlistExist)
    {
        await Playlist.findByIdAndUpdate(playlist._id, {
            $pull: {videos: videoExist._id}
        });
    }

    const videoDeleted = await Video.findByIdAndDelete(videoExist._id);

    return res.status(200).json(
        new ApiResponse(200, "Video deleted successfully", videoDeleted)
    );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const videoExist = await findById(videoId);

    if(!videoExist) throw new ApiError(403, "No video exist for this id");
    if((req.user._id !== videoExist.owner)) throw new ApiError(403, "You are not the owner of this video");

    videoExist.isPublished = !videoExist.isPublished;
    await videoExist.save({new: true});

    return res.status(200).json(
        new ApiResponse(200, "Status of video is now changed", videoExist)
    );
})

const increaseView = asyncHandler(async (req, res) =>
{
    const {videoId} = req.params;

    const videoExist = await Video.findByIdAndUpdate(videoId, {
        $inc: {views: 1}
    }, {new: true});

    if(!videoExist) throw new ApiError(404, "Video does not exist for this id");

    return res.status(200).json(
        new ApiResponse(200, "View count is increased", videoExist)
    );
});

export {
    getAllVideos, publishAVideo, getVideoById,
    updateVideo, deleteVideo, togglePublishStatus,
    increaseView, 
}