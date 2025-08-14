import prisma from '../config/database';
import { AppError } from '../utils/errors';
import fs from 'fs/promises';
import path from 'path';
import { EntityType, DocumentType } from '@prisma/client';

interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

interface FileMetadata {
  entityType: EntityType;
  entityId: string;
  name: string;
  type: DocumentType;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
}

export class FileService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
  }

  // Upload single file
  async uploadFile(
    file: UploadedFile,
    metadata: Omit<FileMetadata, 'url' | 'size' | 'mimeType'>
  ) {
    try {
      // Generate file URL
      const fileUrl = `${this.baseUrl}/uploads/${path.basename(file.path)}`;

      // Save file metadata to database
      const document = await prisma.document.create({
        data: {
          entityType: metadata.entityType,
          entityId: metadata.entityId,
          name: metadata.name || file.originalname,
          type: metadata.type,
          url: fileUrl,
          size: file.size,
          mimeType: file.mimetype,
          uploadedBy: metadata.uploadedBy,
        },
      });

      return document;
    } catch (error) {
      // Clean up uploaded file on error
      await this.deletePhysicalFile(file.path);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: UploadedFile[],
    metadata: Omit<FileMetadata, 'url' | 'size' | 'mimeType' | 'name'>
  ) {
    const uploadedDocuments = [];

    for (const file of files) {
      try {
        const document = await this.uploadFile(file, {
          ...metadata,
          name: file.originalname,
        });
        uploadedDocuments.push(document);
      } catch (error) {
        console.error(`Failed to upload file ${file.originalname}:`, error);
        // Continue with other files even if one fails
      }
    }

    return uploadedDocuments;
  }

  // Get files by entity
  async getFilesByEntity(entityType: EntityType, entityId: string) {
    const documents = await prisma.document.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents;
  }

  // Get file by ID
  async getFileById(id: string) {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new AppError('File not found', 404);
    }

    return document;
  }

  // Delete file
  async deleteFile(id: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new AppError('File not found', 404);
    }

    // Check if user has permission to delete
    // For now, only the uploader can delete
    if (document.uploadedBy !== userId) {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        throw new AppError('You do not have permission to delete this file', 403);
      }
    }

    // Delete from database
    await prisma.document.delete({
      where: { id },
    });

    // Delete physical file
    const filePath = this.getPhysicalPath(document.url);
    await this.deletePhysicalFile(filePath);

    return { message: 'File deleted successfully' };
  }

  // Delete multiple files
  async deleteMultipleFiles(ids: string[], userId: string) {
    const results = [];

    for (const id of ids) {
      try {
        const result = await this.deleteFile(id, userId);
        results.push({ id, success: true, ...result });
      } catch (error) {
        results.push({ 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to delete file',
        });
      }
    }

    return results;
  }

  // Get file statistics
  async getFileStatistics(userId?: string) {
    const where = userId ? { uploadedBy: userId } : {};

    const [totalFiles, totalSize, filesByType, filesByEntity] = await Promise.all([
      // Total files count
      prisma.document.count({ where }),
      
      // Total size
      prisma.document.aggregate({
        where,
        _sum: {
          size: true,
        },
      }),
      
      // Files by type
      prisma.document.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: {
          size: true,
        },
      }),
      
      // Files by entity type
      prisma.document.groupBy({
        by: ['entityType'],
        where,
        _count: true,
        _sum: {
          size: true,
        },
      }),
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      filesByType: filesByType.map((item: any) => ({
        type: item.type,
        count: item._count,
        size: item._sum.size || 0,
      })),
      filesByEntity: filesByEntity.map((item: any) => ({
        entityType: item.entityType,
        count: item._count,
        size: item._sum.size || 0,
      })),
    };
  }

  // Helper methods

  // Get physical file path from URL
  private getPhysicalPath(fileUrl: string): string {
    const filename = path.basename(fileUrl);
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Search in all upload directories
    const dirs = ['documents', 'images', 'attachments', 'temp'];
    for (const dir of dirs) {
      const filePath = path.join(uploadDir, dir, filename);
      if (require('fs').existsSync(filePath)) {
        return filePath;
      }
    }
    
    // Default to attachments directory
    return path.join(uploadDir, 'attachments', filename);
  }

  // Delete physical file
  private async deletePhysicalFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete physical file:', error);
      // Don't throw error as file might already be deleted
    }
  }

  // Clean up temporary files (older than 24 hours)
  async cleanupTempFiles() {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    try {
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Deleted temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  // Move file from temp to permanent location
  async moveFromTemp(
    tempFilename: string,
    destination: 'documents' | 'images' | 'attachments',
    metadata: Omit<FileMetadata, 'url' | 'size' | 'mimeType'>
  ) {
    const tempPath = path.join(process.cwd(), 'uploads', 'temp', tempFilename);
    const destDir = path.join(process.cwd(), 'uploads', destination);
    const destPath = path.join(destDir, tempFilename);

    try {
      // Check if temp file exists
      await fs.access(tempPath);
      
      // Get file stats
      const stats = await fs.stat(tempPath);
      
      // Move file
      await fs.rename(tempPath, destPath);
      
      // Save to database
      const fileUrl = `${this.baseUrl}/uploads/${destination}/${tempFilename}`;
      
      const document = await prisma.document.create({
        data: {
          entityType: metadata.entityType,
          entityId: metadata.entityId,
          name: metadata.name,
          type: metadata.type,
          url: fileUrl,
          size: stats.size,
          mimeType: this.getMimeType(tempFilename),
          uploadedBy: metadata.uploadedBy,
        },
      });

      return document;
    } catch (error) {
      throw new AppError('Failed to move file from temp', 500);
    }
  }

  // Get MIME type from filename
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Validate file size
  validateFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  // Validate file type
  validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  // Generate unique filename
  generateUniqueFilename(originalname: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const extension = path.extname(originalname);
    const baseName = path.basename(originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .substring(0, 50);
    
    return `${baseName}-${timestamp}-${random}${extension}`;
  }

  // Get file download URL with expiry
  async getDownloadUrl(fileId: string, _expiryMinutes: number = 60): Promise<string> {
    const document = await this.getFileById(fileId);
    
    // In production, you might want to use signed URLs from cloud storage
    // For now, return the direct URL
    return document.url;
  }

  // Copy files to another entity
  async copyFiles(
    fromEntityType: EntityType,
    fromEntityId: string,
    toEntityType: EntityType,
    toEntityId: string,
    uploadedBy: string
  ) {
    const documents = await this.getFilesByEntity(fromEntityType, fromEntityId);
    
    const copiedDocuments = await prisma.document.createMany({
      data: documents.map((doc: any) => ({
        entityType: toEntityType,
        entityId: toEntityId,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        size: doc.size,
        mimeType: doc.mimeType,
        uploadedBy,
      })),
    });

    return { count: copiedDocuments.count };
  }
}

export const fileService = new FileService();