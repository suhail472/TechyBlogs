import { v2 as cloudinary } from 'cloudinary';

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadToCloudinary(base64Image) {
  if (!isConfigured) {
    console.warn('⚠️ Cloudinary is not configured. Falling back to placeholder image.');
    const placeholders = [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200',
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: 'teachyblogs',
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    throw new Error('Cloudinary upload failed: ' + error.message);
  }
}
