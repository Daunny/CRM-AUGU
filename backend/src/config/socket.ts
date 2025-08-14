import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from './database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export class SocketManager {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.initialize();
  }

  private initialize() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = verifyToken(token) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);
      
      // Add socket to user's socket set
      this.addUserSocket(socket.userId!, socket.id);
      
      // Join user-specific room
      socket.join(`user:${socket.userId}`);
      
      // Join role-specific room
      socket.join(`role:${socket.user.role}`);
      
      // Join department room if applicable
      if (socket.user.departmentId) {
        socket.join(`department:${socket.user.departmentId}`);
      }

      // Event handlers
      this.setupEventHandlers(socket);

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        this.removeUserSocket(socket.userId!, socket.id);
      });
    });
  }

  private setupEventHandlers(socket: AuthenticatedSocket) {
    // Mark notification as read
    socket.on('notification:markAsRead', async (notificationId: string) => {
      try {
        await prisma.notification.update({
          where: { 
            id: notificationId,
            userId: socket.userId,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        socket.emit('notification:marked', { notificationId, success: true });
      } catch (error) {
        socket.emit('notification:marked', { notificationId, success: false, error: (error as Error).message });
      }
    });

    // Mark all notifications as read
    socket.on('notification:markAllAsRead', async () => {
      try {
        await prisma.notification.updateMany({
          where: {
            userId: socket.userId,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        socket.emit('notification:allMarked', { success: true });
      } catch (error) {
        socket.emit('notification:allMarked', { success: false, error: (error as Error).message });
      }
    });

    // Subscribe to specific channels
    socket.on('subscribe', (channels: string[]) => {
      channels.forEach(channel => {
        socket.join(channel);
        console.log(`User ${socket.userId} subscribed to ${channel}`);
      });
    });

    // Unsubscribe from channels
    socket.on('unsubscribe', (channels: string[]) => {
      channels.forEach(channel => {
        socket.leave(channel);
        console.log(`User ${socket.userId} unsubscribed from ${channel}`);
      });
    });

    // Get unread notification count
    socket.on('notification:getUnreadCount', async () => {
      try {
        const count = await prisma.notification.count({
          where: {
            userId: socket.userId,
            isRead: false,
          },
        });

        socket.emit('notification:unreadCount', { count });
      } catch (error) {
        socket.emit('notification:unreadCount', { count: 0, error: (error as Error).message });
      }
    });

    // Typing indicators for chat/comments
    socket.on('typing:start', (data: { channel: string; userName: string }) => {
      socket.to(data.channel).emit('typing:started', {
        userId: socket.userId,
        userName: data.userName,
        channel: data.channel,
      });
    });

    socket.on('typing:stop', (data: { channel: string }) => {
      socket.to(data.channel).emit('typing:stopped', {
        userId: socket.userId,
        channel: data.channel,
      });
    });
  }

  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // Public methods for sending notifications

  // Send notification to specific user
  async sendToUser(userId: string, notification: any) {
    // Save to database
    const saved = await prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
      },
    });

    // Send real-time notification
    this.io.to(`user:${userId}`).emit('notification:new', saved);
    
    return saved;
  }

  // Send notification to multiple users
  async sendToUsers(userIds: string[], notification: any) {
    // Save to database for all users
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
      })),
    });

    // Send real-time notifications
    userIds.forEach(userId => {
      this.io.to(`user:${userId}`).emit('notification:new', {
        ...notification,
        userId,
      });
    });

    return notifications;
  }

  // Send notification to role
  async sendToRole(role: string, notification: any) {
    // Get all users with this role
    const users = await prisma.user.findMany({
      where: {
        role: role as any,
        isActive: true,
      },
      select: { id: true },
    });

    const userIds = users.map((u: any) => u.id);
    return this.sendToUsers(userIds, notification);
  }

  // Send notification to department
  async sendToDepartment(departmentId: string, notification: any) {
    // Get all users in this department
    const users = await prisma.user.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      select: { id: true },
    });

    const userIds = users.map((u: any) => u.id);
    return this.sendToUsers(userIds, notification);
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Send to specific room/channel
  sendToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Get all online user IDs
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Get socket instance (for external use)
  getIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let socketManager: SocketManager | null = null;

export const initializeSocket = (server: HTTPServer): SocketManager => {
  if (!socketManager) {
    socketManager = new SocketManager(server);
  }
  return socketManager;
};

export const getSocketManager = (): SocketManager => {
  if (!socketManager) {
    throw new Error('Socket manager not initialized');
  }
  return socketManager;
};