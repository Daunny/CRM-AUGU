import cron from 'node-cron';
import { taskService } from '../services/task.service';
import logger from '../utils/logger';

// Process task reminders every 30 minutes
export const startTaskReminderJob = () => {
  cron.schedule('*/30 * * * *', async () => {
    try {
      logger.info('Processing task reminders...');
      await taskService.processTaskReminders();
      logger.info('Task reminders processed successfully');
    } catch (error) {
      logger.error('Error in task reminder job:', error);
    }
  });

  logger.info('Task reminder job scheduled (every 30 minutes)');
};

// Check for overdue tasks every hour
export const startOverdueTaskJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Checking for overdue tasks...');
      
      // This would typically update all overdue tasks
      // For now, we'll just log
      logger.info('Overdue task check completed');
    } catch (error) {
      logger.error('Error in overdue task job:', error);
    }
  });

  logger.info('Overdue task job scheduled (every hour)');
};