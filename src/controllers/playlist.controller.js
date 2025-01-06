import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/Video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist

    if (!name) throw new ApiError(400, "Please provide the name of playlist");
    if (!description) throw new ApiError(400, "Please provide the description of playlist");

    const createPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200, "New playlist is created", createPlaylist)
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!userId) throw new ApiError(400, "Please provide the userId");

    const getPlaylist = await Playlist.find({ owner: userId });

    return res.status(200).json(
        new ApiResponse(200, "Here is the list of all playlist created by this user", getPlaylist)
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!playlistId) throw new ApiError(400, "No playlist id is provided");

    const getPlaylist = await Playlist.findOne({ _id: playlistId });

    if (!getPlaylist) throw new ApiError(404, "No playlist found for this id");

    return res.status(200).json(
        new ApiResponse(200, "Here is the playlist", getPlaylist)
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // check for playlistId and videoId
    // check if video and playlist exist or not
    // add the video id to playlist

    if (!playlistId) throw new ApiError(404, "Playlist id is not provided");
    if (!videoId) throw new ApiError(404, "Video id is not provided");

    const videoExist = await Video.findById(videoId);
    if (!videoExist) throw new ApiError(404, "No video exist for this id");

    const playlistExist = await Playlist.findById(playlistId);
    if (!playlistExist) throw new ApiError(404, "No playlist exist for this id");

    if (playlistExist.video.included(videoExist._id)) {
        throw new ApiError(400, "Video already exist in playlist");
    }

    playlistExist.video.push(videoExist._id);
    await playlistExist.save();

    return res.status(200).json(
        new ApiResponse(200, "Video is been added to playlist", playlistExist)
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    // check for playlistId and videoId
    // check if video and playlist exist or not
    // normally use $pull from the array

    if (!playlistId) throw new ApiError(400, "Playlist id is not provided");
    if (!videoId) throw new ApiError(400, "Video id is not provided");

    const playlistExist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull: {
                videos: videoId
            },
        },
        { new: true }
    );
    if (!playlistExist) throw new ApiError(404, "Playlist does not exist for this id");

    return res.status(200).json(
        new ApiResponse(200, "Video has been removed from playlist")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    // check if playlist id provided or not
    // check for the playlist if exist or not
    // delte the playlist normally

    if (!playlistId) throw new ApiError(400, "Playlist id is not provided");

    const playlistExist = await Playlist.findByIdAndDelete(playlistId);
    if (!playlistExist) throw new ApiError(404, "Playlist does not exist for this id");

    return res.status(200).json(
        new ApiResponse(200, "Playlist is now deleted", playlistExist)
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    // check for playlistid and the existance of it
    // create a options of data which need to be updated
    // just update the playlist normally

    if (!playlistId) throw new ApiError(400, "Playlist id is missing");
    if (!name && !description) throw new ApiError(400, "Please provide atleast one data to be updated");

    const updateOptions = {};
    if (name) updateOptions.name = name;
    if (description) updateOptions.description = description;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: updateOptions
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, "Playlist data is now updated", updatedPlaylist)
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};