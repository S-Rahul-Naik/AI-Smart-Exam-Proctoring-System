import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFaceImage = async (base64Image, studentId, photoType = 'signup') => {
  try {
    // Use different IDs for signup vs login to prevent overwriting
    // Format must include 'stud[id]' for backend verification to extract student ID
    const photoTypeLabel = photoType === 'login' ? 'login_verified' : 'signup_enrolled';
    const publicId = `stud_${studentId}_${photoTypeLabel}`;
    
    const result = await cloudinary.v2.uploader.upload(base64Image, {
      folder: 'proctor/faces',
      resource_type: 'auto',
      public_id: publicId,
      overwrite: true,
      format: 'jpg',
      quality: 'auto',
      tags: ['face_reference', 'student_verification', photoType],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload face image to Cloudinary');
  }
};

export const deleteFaceImage = async (publicId) => {
  try {
    await cloudinary.v2.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete face image from Cloudinary');
  }
};
