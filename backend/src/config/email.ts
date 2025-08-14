import nodemailer from 'nodemailer';
import { config } from './env';

// Email transporter configuration
const createTransporter = () => {
  // For development, use Ethereal Email (fake SMTP service)
  if (config.app.env === 'development' && !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }

  // For production or when SMTP settings are provided
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  });
};

export const emailTransporter = createTransporter();

// Verify connection configuration
export const verifyEmailConnection = async () => {
  try {
    await emailTransporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
};

// Default email settings
export const emailConfig = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'CRM AUGU',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@crm-augu.com',
  },
  replyTo: process.env.EMAIL_REPLY_TO || 'support@crm-augu.com',
  templates: {
    path: 'src/templates/email',
  },
  attachments: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
    ],
  },
};