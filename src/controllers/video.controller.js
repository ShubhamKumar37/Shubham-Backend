import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


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
    if (!videoExist) throw new ApiError(404, "No video exist for this id");

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
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos, publishAVideo, getVideoById,
    updateVideo, deleteVideo, togglePublishStatus
}