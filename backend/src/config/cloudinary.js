import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileBuffer, fileName, folder = 'proctor') => {
  try {
    return new Promise((resolve, reject) => {
      // Set a 30-second timeout for the upload
      const timeoutId = setTimeout(() => {
        reject(new Error('Cloudinary upload timeout (30s)'));
      }, 30000);

      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: fileName,
          timeout: 30000, // Cloudinary SDK timeout
        },
        (error, result) => {
          clearTimeout(timeoutId);
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      stream.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });

      stream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

export default cloudinary;
