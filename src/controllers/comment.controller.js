import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/Video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query;

    const videoExist = await Video.findById(videoId);
    if (!videoExist) throw new ApiError(404, "No video exist for this id");

    const aggregationPipeline = [
        { $match: { video: videoId } },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
    ];

    const videoComments = await Video.aggregatePaginate(
        aggregationPipeline,
        {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        }
    );

    if (videoComments.length === 0) throw new ApiError(404, "No comment exist for this video");

    return res.status(200).json(
        new ApiResponse(200, "Comments are fetched successfully", videoComments)
    );

});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content.trim()) throw new ApiError(400, "Content is missing");
    if (!videoId) throw new ApiError(404, "Video id is missing");

    const videoExist = await Video.findById(videoId);
    if (!videoExist) throw new ApiError(404, "Video doesnot exist");

    const newComment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoExist._id
    });

    return res.status(200).json(
        new ApiResponse(200, "New comment is now created", newComment)
    );
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId, content } = req.body;

    if (!content || content.trim().length === 0) throw new ApiError(400, "Content is missing");
    if (!commentId) throw new ApiError(400, "Please provide a comment id");

    const commentExist = await Comment.findById(commentId);
    if (!commentExist) throw new ApiError(404, "Comment does not exist");

    if (req.user._id !== commentExist.owner) throw new ApiError(403, "You are not the owner of this comment");

    const updatedComment = await Comment.findByIdAndUpdate(commentExist._id, {
        $set: {
            content: content
        }
    }, { new: true });

    return res.status(200).json(
        new ApiResponse(200, "Comment has been updated", updatedComment)
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.body;

    if (!commentId) throw new ApiError(400, "No comment id is provided");

    const commentExist = await Comment.findByIdAndDelete(commentId);

    if (!commentExist) throw new ApiError(404, "No comment exist for this id");

    return res.status(200).json(
        new ApiResponse(200, "Comment is deleted", commentExist)
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}