import { Tweet } from "./../models/Tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    let { content } = req.body;
    const userId = req.user._id;

    content = content.trim();
    if (!content) throw new ApiError(400, "Please provide a valid tweet content");

    const createTweet = await Tweet.create({
        content,
        owner: userId
    });

    if (!createTweet) {
        throw new ApiError(300, "There is a issue while creating a new tweet");
    }

    return res.status(200).json(
        new ApiResponse(200, "New tweet created successfully", createTweet)
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    const userAllTweets = await Tweet.find({ owner: userId });

    return res.status(200).json(
        new ApiResponse(200, "All tweet fetched successfully", userAllTweets)
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    let { content } = req.body;

    content = content.trim();
    if (!content) throw new ApiError(400, "Please a valid tweet content");

    const tweetExist = await Tweet.findById(tweetId);
    if (!tweetExist) throw new ApiError(400, "No tweet exist for this id");

    tweetExist.content = content;
    await tweetExist.save({ new: true });

    return res.status(200).json(
        new ApiResponse(200, "Tweet is updated successfully", tweetExist)
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    const deleteResponse = await Tweet.findByIdAndDelete(tweetId);

    if (!deleteResponse) throw new ApiError(404, "No tweet exist for this id");

    return res.status(200).json(
        new ApiResponse(200, "Tweet deleted successfully")
    );
});

const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const tweetExist = await Tweet.findById(tweetId);
    if (!tweetExist) throw new ApiError(400, "No tweet exist for this id");

    return res.status(200).json(
        new ApiResponse(200, "This is the tweet", tweetExist)
    );
});

export {
    createTweet, getUserTweets, getTweetById,
    updateTweet, deleteTweet
};