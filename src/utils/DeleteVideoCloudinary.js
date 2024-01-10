import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const DeleteVideoCloudinary = async (publicId , folder) => {
    try {
        if (!publicId) return null;
        //Delete from cloudinary
       const result = await cloudinary.uploader.destroy(publicId , {
            folder: folder,
            resource_type: 'video'
        })
        console.log(result);
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
    }

}

export {DeleteVideoCloudinary}