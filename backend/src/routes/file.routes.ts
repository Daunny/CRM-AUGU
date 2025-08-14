import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  uploadDocument,
  uploadImage,
  uploadAttachment,
  uploadMultipleDocuments,
  uploadMultipleImages,
  uploadMultipleAttachments,
  uploadMixed,
  uploadTemp,
  handleMulterError,
} from '../config/multer';
import {
  uploadFile,
  uploadMultipleFiles,
  getFilesByEntity,
  getFileById,
  deleteFile,
  deleteMultipleFiles,
  getFileStatistics,
  moveFromTemp,
  copyFiles,
  downloadFile,
  serveFile,
} from '../controllers/file.controller';

const router = Router();

// Public route for serving files
router.get('/uploads/:category/:filename', serveFile);

// Apply authentication to all routes below
router.use(authenticate);

// Single file upload endpoints
router.post('/upload/document', uploadDocument.single('file'), handleMulterError, uploadFile);
router.post('/upload/image', uploadImage.single('file'), handleMulterError, uploadFile);
router.post('/upload/attachment', uploadAttachment.single('file'), handleMulterError, uploadFile);
router.post('/upload/temp', uploadTemp.single('file'), handleMulterError, uploadFile);

// Multiple files upload endpoints
router.post('/upload/documents', uploadMultipleDocuments, handleMulterError, uploadMultipleFiles);
router.post('/upload/images', uploadMultipleImages, handleMulterError, uploadMultipleFiles);
router.post('/upload/attachments', uploadMultipleAttachments, handleMulterError, uploadMultipleFiles);

// Mixed files upload
router.post('/upload/mixed', uploadMixed, handleMulterError, uploadMultipleFiles);

// File management
router.get('/entity/:entityType/:entityId', getFilesByEntity);
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);
router.post('/delete-multiple', deleteMultipleFiles);

// File operations
router.post('/move-from-temp', moveFromTemp);
router.post('/copy', copyFiles);

// Statistics
router.get('/statistics/overview', getFileStatistics);

// Admin only routes
router.get('/statistics/all', authorize('ADMIN'), getFileStatistics);

export default router;