import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (_, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    try {
        return res.status(200).json(
            new ApiResponse(200, "Backend is healthy")
        );
    }
    catch (error) {
        throw new ApiError(500, "Need to check backend");
    }
});

export {
    healthcheck
};
