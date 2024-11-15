import {v2} from "cloudinary";
import fs from "fs";

v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const uploadCloudinary = async (localFilePath) =>
{
    try
    {
        if(!localFilePath) return null;

        // Upload to cloudinary
        const response = await v2.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "Shubham_Backend_Media"
        });

        console.log("This is cloudinary upload response = ", response);

        return response;
    }
    catch(error)
    {
        fs.unlinkSync(localFilePath);
        console.log("Error occur while uploading file to cloudinary :: ", error);
        return null;
    }
}

export {uploadCloudinary};