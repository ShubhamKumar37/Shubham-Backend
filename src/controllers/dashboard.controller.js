import mongoose from "mongoose"
import { Video } from "../models/Video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // total - videos, views, subscriber, likes
    // data - avatar, coverimage, username, _id

    try {
        const { channelId } = req.params;

        if (!channelId) throw new ApiError(400, "Channel id is not provided");

        const channelExist = await User.findById(channelId).select("-password -refreshToken -email");
        if (!channelExist) throw new ApiError(404, "Channel does not exist");

        const subscriberCountAggregation = [
            { $match: { channel: channelExist._id } },
            { $count: "count" }
        ];

        const viewsCountAggregation = [
            { $match: { owner: channelExist._id } },
            {
                $group: {
                    _id: null,
                    count: { $sum: "$views" }
                }
            }
        ];

        const likesCountAggregation = [
            { $match: { owner: channelExist._id } },
            {
                $lookup: {
                    from: "likes",
                    localField: "$_id",
                    foreignField: "$video",
                    as: "likedVideo"
                }
            },
            { $count: "count" }
        ];

        const videosCountAggregation = [
            { $match: { owner: channelExist } },
            { $count: "count" }
        ];

        // let subscriberCount = await Subscription.aggregate(subscriberCountAggregation);
        // let viewsCount = await Video.aggregate(viewsCountAggregation);
        // let likesCount = await Video.aggregate(likesCountAggregation);
        // let videosCount = await Video.aggregate(videosCountAggregation);

        let [subscriberCount, viewsCount, likesCount, videosCount] = await Promise.all([
            Subscription.aggregate(subscriberCountAggregation),
            Video.aggregate(viewsCountAggregation),
            Video.aggregate(likesCountAggregation),
            Video.aggregate(videosCountAggregation)
        ]);

        subscriberCount = subscriberCount.length ? subscriberCount[0].count : 0;
        viewsCount = viewsCount.length ? viewsCount[0].count : 0;
        likesCount = likesCount.length ? likesCount[0].count : 0;
        videosCount = videosCount.length ? videosCount[0].count : 0;

        channelExist.subscribers = subscriberCount;
        channelExist.views = viewsCount;
        channelExist.likes = likesCount;
        channelExist.videos = videosCount;


        return res.status(200).json(
            new ApiResponse(200, "Channel stats are fetched", channelExist)
        );
    } catch (error) {
        throw new ApiError(500, "Failed to fetch the channel stats");
    }
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const { page = 1, limit = 20, sortBy = "createdAt", sortType = 1, userId } = req.query
    const skipPage = ((page - 1) * limit);

    const videoResult = await Video.find({ owner: userId }).sort({ [sortBy]: sortType }).skip(skipPage).limit(Number(limit));
    if (videoResult.length === 0) throw new ApiError(404, "No uploaded yet");

    return res.status(200).json(
        new ApiResponse(200, `Videos are fetched for page number ${page}`, videoResult)
    );
});

export {
    getChannelStats,
    getChannelVideos
};