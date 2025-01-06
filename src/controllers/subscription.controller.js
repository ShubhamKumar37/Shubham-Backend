import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    const channelExist = await User.findById(channelId);

    if (!channelExist) throw new ApiError(404, "Channel doesnot exist");

    const toggleSub = await Subscription.findOne({ channel: channelId, subscriber: req.user._id });

    if (!toggleSub) {
        await Subscription.create({ channel: channelId, subscriber: req.user._id });
        return res.status(200).json(
            new ApiResponse(200, "Successfully subscribed")
        );
    }

    await Subscription.findByIdAndDelete(toggleSub._id);

    return res.status(200).json(
        new ApiResponse(200, "Successfully unsubscribed")
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const aggregationPipeline = [
        {
            $match: {
                channel: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "data"
            }
        },
        {
            $unwind:
            {
                path: "data",
                preserveNullAndEmptyArrays: true  // If no data is found then there will be a empty array will be available
            }
        },
        {
            $addFields: {
                subscriberId: "$data._id",
                userName: "$data.userName"
            }
        },
        {
            $project: {
                data: 0,
            }
        }
    ];

    const allSubscribers = await Subscription.aggregate(aggregationPipeline);

    return res.status(200).json(
        new ApiResponse(200, "All subscriber are fetched", allSubscribers)
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    const aggregationPipeline = [
        {
            $match: {
                subscriber: subscriberId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "data"
            }
        },
        {
            $unwind:
            {
                path: "$data",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                channelId: "$data._id",
                avatar: "$data.avatar",
                userName: "$data.userName",
            }
        },
        {
            $project: {
                data: 0
            }
        }
    ];

    const allChannelSubscribed = await Subscription.aggregate(aggregationPipeline);

    return res.status(200).json(
        new ApiResponse(200, "These channel are subscribed by user", allChannelSubscribed)
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};