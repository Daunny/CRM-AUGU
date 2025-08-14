import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';

// Get notifications for current user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { type, isRead, dateFrom, dateTo, page, limit } = req.query;
    
    const filter = {
      type: type as string,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const notifications = await notificationService.getNotifications(
      req.user!.id,
      filter,
      Number(page) || 1,
      Number(limit) || 20
    );

    res.json({
      success: true,
      data: notifications.data,
      unreadCount: notifications.unreadCount,
      pagination: {
        total: notifications.total,
        page: notifications.page,
        totalPages: notifications.totalPages,
      },
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const result = await notificationService.getUnreadCount(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count',
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user!.id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to mark notification as read',
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const result = await notificationService.markAllAsRead(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await notificationService.deleteNotification(id, req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to delete notification',
    });
  }
};

// Delete all read notifications
export const deleteReadNotifications = async (req: Request, res: Response) => {
  try {
    const result = await notificationService.deleteReadNotifications(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete read notifications',
    });
  }
};

// Send notification (Admin only)
export const sendNotification = async (req: Request, res: Response) => {
  try {
    const result = await notificationService.createNotification(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to send notification',
    });
  }
};

// Send system announcement (Admin only)
export const sendAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, message, targetRole } = req.body;
    
    const result = await notificationService.sendSystemAnnouncement(
      title,
      message,
      targetRole
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send announcement',
    });
  }
};

// Test notification endpoints (for development)
export const testNotifications = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const userId = req.user!.id;
    const userName = req.user!.name || 'Test User';

    let result;

    switch (type) {
      case 'task':
        result = await notificationService.createNotification({
          userId,
          type: 'TASK_ASSIGNED',
          title: 'Test Task Assignment',
          message: `${userName} assigned you a test task`,
          metadata: { test: true },
        });
        break;

      case 'opportunity':
        result = await notificationService.createNotification({
          userId,
          type: 'OPPORTUNITY_UPDATE',
          title: 'Test Opportunity Update',
          message: 'Your opportunity has been updated',
          metadata: { test: true },
        });
        break;

      case 'meeting':
        result = await notificationService.createNotification({
          userId,
          type: 'MEETING_REMINDER',
          title: 'Test Meeting Reminder',
          message: 'You have a meeting in 15 minutes',
          metadata: { test: true },
        });
        break;

      case 'system':
        result = await notificationService.createNotification({
          userId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Test System Announcement',
          message: 'This is a test system announcement',
          metadata: { test: true },
        });
        break;

      default:
        result = await notificationService.createNotification({
          userId,
          type: 'TEST',
          title: 'Test Notification',
          message: 'This is a test notification',
          metadata: { test: true, timestamp: new Date() },
        });
    }

    res.json({
      success: true,
      data: result,
      message: 'Test notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
};