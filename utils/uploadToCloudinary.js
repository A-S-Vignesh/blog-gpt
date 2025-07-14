// utils/uploadToCloudinary.js
import cloudinary from "@/lib/cloudinary";

export const uploadImage = async (base64Image) => {
  const uploadResponse = await cloudinary.uploader.upload(base64Image, {
    folder: "blog-gpt",
  });
  return uploadResponse.secure_url;
};
