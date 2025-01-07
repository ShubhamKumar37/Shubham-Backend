import { Video } from "../models/Video.model.js"
import { User } from "../models/User.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadCloudinary } from "../utils/cloudinary.js"
import { getFilePublicId } from "../utils/GetPublicId.js"
import { Playlist } from "../models/Playlist.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination

    const { page = 1, limit = 10, query, sortBy = "views", sortType = 1, userId } = req.query
    const skipPage = ((page - 1) * limit);
    const filter = {};

    if (query) filter.title = { $regex: query, options: "i" };
    if (userId) filter.owner = userId;

    const videoResult = await Video.find(filter).sort({ [sortBy]: sortType }).skip(skipPage).limit(limit).populate("owner", "userName avatar")
    if (videoResult.length === 0) throw new ApiError(404, "No data found for your query");

    return res.status(200).json(
        new ApiResponse(200, `Videos are fetched for page number ${page}`, videoResult)
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title) throw new ApiError(404, "Title is missing");
    if (!description) throw new ApiError(404, "Description is missing");

    let thumbnailPath;
    let videoFilePath;

    if (req?.files && Array.isArray(req?.files?.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailPath = req.files.thumbnail[0]?.path;
    }
    else throw new ApiError(400, "Thumbnail is not provided");

    if (req.files && Array.isArray(req?.files?.videoFile) && req.files.videoFile.length > 0) {
        videoFilePath = req.files.videoFile[0]?.path;
    }
    else throw new ApiError(400, "Video is not provided");

    // Upload to cloudinary
    const thumbnailResponse = await uploadCloudinary(thumbnailPath);
    const videoFileResponse = await uploadCloudinary(videoFilePath);

    const newVideo = await Video.create({
        title,
        description,
        thumbnail: thumbnailResponse.secure_url,
        videoFile: videoFileResponse.secure_url,
        duration: videoFileResponse.duration,
        owner: req.user._id,
    });

    return res.status(200).json(
        new ApiResponse(200, "New video is created", newVideo)
    );

});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const videoExist = await Video.findById(videoId);
    if (!videoExist || (req.user._id !== videoExist.owner && videoExist.isPublished === false)) throw new ApiError(404, "No video exist for this id"); // Need to check this part (may be)

    await User.findByIdAndUpdate(req.user._id,
        {
            $push: { watchHistory: videoId }
        }
    )

    return res.status(200).json(
        new ApiResponse(200, "Video fetched successfully", videoExist)
    );
});
// Need to work here 
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const thumbnailLocalPath = req.file?.path;
    //TODO: update video details like title, description, thumbnail

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

    if (thumbnailLocalPath) {
        const publicId = getFilePublicId(videoExist.thumbnail);
        await deleteFromCloudinary(publicId, "image");

        const uploadResponse = await uploadCloudinary(thumbnailLocalPath);
        updateOptions.thumbnail = uploadResponse.secure_url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        $set: updateOptions
    }, { new: true });

    console.log("This is updatedvideo response = ", updatedVideo);

    return res.status(200).json(
        new ApiResponse(200, "Video details are now updated", updatedVideo)
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const videoExist = await Video.findById(videoId);

    if (!videoExist) throw new ApiError(404, "No video exist for this id");
    if (!videoExist.owner.equals(req.user._id)) throw new ApiError(403, "You are not the owner of video");

    // Need to delete cloudinary files
    const videoFileDeleteCloudinary = await deleteFromCloudinary(getFilePublicId(videoExist.videoFile), "video");
    const thumbnailFileDeleteCloudinary = await deleteFromCloudinary(getFilePublicId(videoExist.thumbnail), "image");

    console.log("This is video file delete response = ", videoFileDeleteCloudinary);
    console.log("This is thumbnail file delete response = ", thumbnailFileDeleteCloudinary);

    const playlistExist = await Playlist.find({ owner: videoExist.owner });
    for (let playlist of playlistExist) {
        await Playlist.findByIdAndUpdate(playlist._id, {
            $pull: { videos: videoExist._id }
        });
    }

    const videoDeleted = await Video.findByIdAndDelete(videoExist._id);

    return res.status(200).json(
        new ApiResponse(200, "Video deleted successfully", videoDeleted)
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const videoExist = await Video.findById(videoId);

    if (!videoExist) throw new ApiError(403, "No video exist for this id");

    if (!videoExist.owner.equals(req.user._id)) throw new ApiError(403, "You are not the owner of this video");

    videoExist.isPublished = !videoExist.isPublished;
    await videoExist.save({ new: true });

    return res.status(200).json(
        new ApiResponse(200, "Status of video is now changed", videoExist)
    );
});

const increaseView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const videoExist = await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    }, { new: true });

    if (!videoExist) throw new ApiError(404, "Video does not exist for this id");

    return res.status(200).json(
        new ApiResponse(200, "View count is increased", videoExist)
    );
});

export {
    getAllVideos, publishAVideo, getVideoById,
    updateVideo, deleteVideo, togglePublishStatus,
    increaseView,
};