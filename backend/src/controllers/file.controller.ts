import { Request, Response } from 'express';
import { fileService } from '../services/file.service';
import { EntityType, DocumentType } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Upload single file
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { entityType, entityId, documentType } = req.body;

    if (!entityType || !entityId || !documentType) {
      // Clean up uploaded file
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entityType, entityId, documentType',
      });
    }

    const document = await fileService.uploadFile(req.file, {
      entityType: entityType as EntityType,
      entityId,
      name: req.file.originalname,
      type: documentType as DocumentType,
      uploadedBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
    });
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const { entityType, entityId, documentType } = req.body;

    if (!entityType || !entityId || !documentType) {
      // Clean up uploaded files
      files.forEach(file => {
        if (file.path) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: entityType, entityId, documentType',
      });
    }

    const documents = await fileService.uploadMultipleFiles(files, {
      entityType: entityType as EntityType,
      entityId,
      type: documentType as DocumentType,
      uploadedBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    // Clean up uploaded files on error
    const files = req.files as Express.Multer.File[];
    if (files) {
      files.forEach(file => {
        if (file.path) {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            // File might already be deleted
          }
        }
      });
    }
    
    console.error('Error uploading multiple files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files',
    });
  }
};

// Get files by entity
export const getFilesByEntity = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: entityType, entityId',
      });
    }

    const documents = await fileService.getFilesByEntity(
      entityType as EntityType,
      entityId
    );

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get files',
    });
  }
};

// Get file by ID
export const getFileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await fileService.getFileById(id);

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get file',
    });
  }
};

// Delete file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await fileService.deleteFile(id, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to delete file',
    });
  }
};

// Delete multiple files
export const deleteMultipleFiles = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No file IDs provided',
      });
    }

    const results = await fileService.deleteMultipleFiles(ids, req.user!.id);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error deleting files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete files',
    });
  }
};

// Get file statistics
export const getFileStatistics = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const statistics = await fileService.getFileStatistics(userId as string);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error getting file statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file statistics',
    });
  }
};

// Move file from temp
export const moveFromTemp = async (req: Request, res: Response) => {
  try {
    const { tempFilename, destination, entityType, entityId, documentType, name } = req.body;

    if (!tempFilename || !destination || !entityType || !entityId || !documentType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const document = await fileService.moveFromTemp(
      tempFilename,
      destination as 'documents' | 'images' | 'attachments',
      {
        entityType: entityType as EntityType,
        entityId,
        name: name || tempFilename,
        type: documentType as DocumentType,
        uploadedBy: req.user!.id,
      }
    );

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error moving file from temp:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to move file',
    });
  }
};

// Copy files to another entity
export const copyFiles = async (req: Request, res: Response) => {
  try {
    const { fromEntityType, fromEntityId, toEntityType, toEntityId } = req.body;

    if (!fromEntityType || !fromEntityId || !toEntityType || !toEntityId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const result = await fileService.copyFiles(
      fromEntityType as EntityType,
      fromEntityId,
      toEntityType as EntityType,
      toEntityId,
      req.user!.id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error copying files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to copy files',
    });
  }
};

// Download file
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await fileService.getFileById(id);

    // Extract filename from URL
    const filename = path.basename(document.url);
    
    // Determine file path
    const uploadDir = path.join(process.cwd(), 'uploads');
    const dirs = ['documents', 'images', 'attachments'];
    let filePath = '';
    
    for (const dir of dirs) {
      const testPath = path.join(uploadDir, dir, filename);
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server',
      });
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', document.size.toString());

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to download file',
    });
  }
};

// Serve uploaded files (for direct access)
export const serveFile = async (req: Request, res: Response) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', category, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Get file stats for size
    const stats = fs.statSync(filePath);
    
    // Determine MIME type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Set headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size.toString());
    
    // For images, allow inline display
    if (mimeType.startsWith('image/')) {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve file',
    });
  }
};