import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Make sure these are loaded correctly
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("❌ Cloudinary config missing in .env file!");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 1. Candidate Storage (Simplified)
const candidateStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'workforce_candidates',
    // REMOVED 'allowed_formats' from here to fix signature error
    // We will validate this in the route file instead
    transformation: [{ width: 500, height: 500, crop: 'limit' }], 
  },
});

// 2. Company Storage (Simplified)
const companyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'workforce_companies',
      resource_type: 'auto', 
      // REMOVED 'allowed_formats' from here too
    };
  },
});

export { cloudinary, candidateStorage, companyStorage };