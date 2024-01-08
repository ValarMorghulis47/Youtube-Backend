import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilepath, folder) => {
    try {
        if (!localfilepath) return null;
        //Upload on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto",
            folder: folder
        })
        // console.log(`file has been uploaded ${response.url}`);
        fs.unlinkSync(localfilepath)
        // console.log(response)
        return response;
    } catch (error) {
        fs.unlinkSync(localfilepath)// remove the locally save temporary file as the upload operation failed
        return null;
    }

}

export {uploadOnCloudinary}