import { v2 as cloudinary } from 'cloudinary';

function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    return cloudinary;
  }
  return null;
}

export async function uploadToCloudinary(base64Image) {
  const client = getCloudinary();
  if (!client) {
    console.warn('⚠️ Cloudinary is not configured in local environment. Using local image data URL fallback.');
    if (base64Image && (base64Image.startsWith('data:image/') || base64Image.startsWith('http'))) {
      return base64Image;
    }
    const placeholders = [
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200',
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  }

  try {
    const uploadResponse = await client.uploader.upload(base64Image, {
      folder: 'techyblogs',
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 630, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
      ]
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    throw new Error('Cloudinary upload failed: ' + error.message);
  }
}
