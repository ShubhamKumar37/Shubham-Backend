export const getFilePublicId = (url) => {
    if (!url) return null;

    const parts = url.split("/").at(-1).split(".")[0];

    return process.env.CLOUDINARY_FOLDER + parts;
};
