import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = ['uploads/temp', 'uploads/documents', 'uploads/images', 'uploads/attachments'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File type configurations
const fileTypeConfig = {
  documents: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    destination: 'uploads/documents',
  },
  images: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    destination: 'uploads/images',
  },
  attachments: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-rar-compressed',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    destination: 'uploads/attachments',
  },
};

// Storage configuration
const createStorage = (uploadType: 'documents' | 'images' | 'attachments' | 'temp') => {
  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      const destination = uploadType === 'temp' 
        ? 'uploads/temp' 
        : fileTypeConfig[uploadType]?.destination || 'uploads/temp';
      cb(null, destination);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const uniqueSuffix = `${uuidv4()}`;
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension)
        .replace(/[^a-zA-Z0-9-_]/g, '') // Remove special characters
        .substring(0, 50); // Limit filename length
      cb(null, `${baseName}-${uniqueSuffix}${extension}`);
    },
  });
};

// File filter
const createFileFilter = (uploadType: 'documents' | 'images' | 'attachments') => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const config = fileTypeConfig[uploadType];
    
    if (!config) {
      cb(new Error('Invalid upload type'));
      return;
    }

    if (config.mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${config.mimeTypes.join(', ')}`));
    }
  };
};

// Create multer instances for different upload types
export const uploadDocument = multer({
  storage: createStorage('documents'),
  limits: {
    fileSize: fileTypeConfig.documents.maxSize,
  },
  fileFilter: createFileFilter('documents'),
});

export const uploadImage = multer({
  storage: createStorage('images'),
  limits: {
    fileSize: fileTypeConfig.images.maxSize,
  },
  fileFilter: createFileFilter('images'),
});

export const uploadAttachment = multer({
  storage: createStorage('attachments'),
  limits: {
    fileSize: fileTypeConfig.attachments.maxSize,
  },
  fileFilter: createFileFilter('attachments'),
});

// Temporary upload for processing
export const uploadTemp = multer({
  storage: createStorage('temp'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for temp files
  },
});

// Multiple file upload configurations
export const uploadMultipleDocuments = uploadDocument.array('documents', 10);
export const uploadMultipleImages = uploadImage.array('images', 10);
export const uploadMultipleAttachments = uploadAttachment.array('attachments', 10);

// Mixed file upload
export const uploadMixed = multer({
  storage: createStorage('attachments'),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
}).fields([
  { name: 'documents', maxCount: 5 },
  { name: 'images', maxCount: 10 },
  { name: 'attachments', maxCount: 5 },
]);

// Error handler middleware
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field',
      });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  
  next(error);
};