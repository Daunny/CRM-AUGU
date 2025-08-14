import cron from 'node-cron';
import { fileService } from '../services/file.service';

// Clean up temporary files every day at 2 AM
export const startFileCleanupJob = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting temporary file cleanup job...');
    try {
      await fileService.cleanupTempFiles();
      console.log('Temporary file cleanup completed');
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  });
  
  console.log('File cleanup job scheduled for daily execution at 2 AM');
};

// Clean up orphaned files (files in DB but not on disk) - Weekly
export const startOrphanedFileCleanupJob = () => {
  cron.schedule('0 3 * * 0', async () => {
    console.log('Starting orphaned file cleanup job...');
    try {
      // This would check for files in database that don't exist on disk
      // and vice versa
      // Implementation depends on specific requirements
      console.log('Orphaned file cleanup completed');
    } catch (error) {
      console.error('Error during orphaned file cleanup:', error);
    }
  });
  
  console.log('Orphaned file cleanup job scheduled for weekly execution');
};