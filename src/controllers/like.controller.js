import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { Video } from "../models/Video.model.js"
import { Tweet } from "../models/Tweet.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    const videoExist = await Video.findById(videoId);
    if (!videoExist) throw new ApiError(404, "Video doesnot exist");

    const likeExist = await Like.findOne({ likedBy: req.user._id, video: videoId });

    if (!likeExist) {
        await Like.create({ video: videoId, likedBy: req.user._id });

        return res.status(200).json(
            new ApiResponse(200, "Video now liked")
        );
    }

    await Like.findByIdAndDelete(likeExist._id);

    return res.status(200).json(
        new ApiResponse(200, "Video like is now toggled")
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    const commentExist = await Comment.findById(commentId);
    if (!commentExist) throw new ApiError(404, "Comment doesnot exist");

    const likeExist = await Like.findOne({ likedBy: req.user._id, comment: commentId });

    if (!likeExist) {
        await Like.create({ comment: commentId, likedBy: req.user._id });

        return res.status(201).json(
            new ApiResponse(201, "Comment is now liked")
        );
    }

    await Like.findByIdAndDelete(likeExist._id);

    return res.status(200).json(
        new ApiResponse(200, "Comment like is now toggled")
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    const tweetExist = await Tweet.findById(tweetId);
    if (!tweetExist) throw new ApiError(404, "Tweet doesnot exist");

    const likeExist = await Like.findOne({ likedBy: req.user._id, tweet: tweetId });

    if (!likeExist) {
        await Like.create({ tweet: tweetId, likedBy: req.user._id });

        return res.status(201).json(
            new ApiResponse(201, "Tweet is now liked")
        );
    }

    await Like.findByIdAndDelete(likeExist._id);

    return res.status(200).json(
        new ApiResponse(200, "Tweet like is now toggled")
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const { page = 1, limit = 10 } = req.query;
    const skip = ((parseInt(page, 10) - 1) * parseInt(limit, 10));

    const getVideos = await Like.find({ likedBy: req.user._id }).skip(skip).limit(limit).populate("video").exec();

    return res.status(200).json(
        new ApiResponse(200, "There are the liked videos", getVideos)
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
};