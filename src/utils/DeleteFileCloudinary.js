import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const DeleteFileCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        //Delete from cloudinary
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto"
        })
        return response;
    } catch (error) {
        return null;
    }

}

export {DeleteFileCloudinary}