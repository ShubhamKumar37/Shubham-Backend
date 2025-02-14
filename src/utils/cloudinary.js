import { v2 } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv"

dotenv.config();

v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});



const uploadCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload to cloudinary
        const response = await v2.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "Shubham_Backend_Media"
        });

        console.log("This is cloudinary upload response = ", response);
        fs.unlinkSync(localFilePath);

        return response;
    }
    catch (error) {
        fs.unlink(localFilePath, (err) => {
            if (err) console.log("Failed to delete local file:", err.message);
        });  // Remove file from local because upload operation fails
        console.log("Error occur while uploading file to cloudinary :: ", error.message);
        return null;
    }
}

const deleteFromCloudinary = async (publicId, fileType) => {
    try {
        if (!publicId) {
            return null;
        }

        const response = await v2.uploader.destroy(publicId, { resource_type: fileType });

        console.log("File is deleted from cloudinary successfully");
        console.log("Here is the response of deleted file = ", response);

        return response;
    } catch (error) {
        console.log("Error occur while deleting file from cloudinary :: ", error.message);
        return null;
    }
};

export { uploadCloudinary, deleteFromCloudinary };