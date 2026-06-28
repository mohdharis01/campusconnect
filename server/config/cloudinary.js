const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusconnect/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

// Storage for notes (PDFs, docs)
const notesStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusconnect/notes',
    allowed_formats: ['pdf', 'docx', 'ppt', 'pptx', 'zip'],
    resource_type: 'raw',
  },
});

// Storage for blog images
const blogStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusconnect/blogs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
});

// Fallback local storage when Cloudinary is not configured
const localStorage = multer.memoryStorage();

const isCloudinaryConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

const uploadProfile = multer({
  storage: isCloudinaryConfigured() ? profileStorage : localStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadNotes = multer({
  storage: isCloudinaryConfigured() ? notesStorage : localStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const uploadBlogImage = multer({
  storage: isCloudinaryConfigured() ? blogStorage : localStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { cloudinary, uploadProfile, uploadNotes, uploadBlogImage };
