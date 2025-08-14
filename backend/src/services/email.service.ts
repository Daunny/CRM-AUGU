import { emailTransporter, emailConfig } from '../config/email';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: any;
  html?: string;
  text?: string;
  attachments?: any[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

interface EmailLog {
  to: string;
  subject: string;
  template?: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  sentAt: Date;
}

export class EmailService {
  private compiledTemplates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.registerHelpers();
  }

  // Register Handlebars helpers
  private registerHelpers() {
    handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('ko-KR');
    });

    handlebars.registerHelper('formatDateTime', (date: Date) => {
      return new Date(date).toLocaleString('ko-KR');
    });

    handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
      }).format(amount);
    });

    handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    handlebars.registerHelper('lte', (a: any, b: any) => a <= b);
    handlebars.registerHelper('gte', (a: any, b: any) => a >= b);
  }

  // Load and compile template
  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    // Check cache
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    try {
      const templatePath = path.join(
        process.cwd(),
        emailConfig.templates.path,
        `${templateName}.hbs`
      );
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateContent);
      
      // Cache compiled template
      this.compiledTemplates.set(templateName, compiled);
      
      return compiled;
    } catch (error) {
      console.error(`Failed to load email template ${templateName}:`, error);
      throw new AppError(`Email template ${templateName} not found`, 500);
    }
  }

  // Load base template
  private async loadBaseTemplate(): Promise<handlebars.TemplateDelegate> {
    return this.loadTemplate('base');
  }

  // Send email
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      let html = options.html;

      // If template is specified, compile it
      if (options.template && options.data) {
        const template = await this.loadTemplate(options.template);
        const content = template(options.data);
        
        // Wrap in base template
        const baseTemplate = await this.loadBaseTemplate();
        html = baseTemplate({
          subject: options.subject,
          content,
          replyTo: options.replyTo || emailConfig.replyTo,
          year: new Date().getFullYear(),
          websiteUrl: process.env.WEBSITE_URL || 'http://localhost:5173',
          ...options.data,
        });
      }

      // Prepare email options
      const mailOptions = {
        from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo || emailConfig.replyTo,
        attachments: options.attachments,
      };

      // Send email
      const info = await emailTransporter.sendMail(mailOptions);
      
      // Log success
      await this.logEmail({
        to: mailOptions.to,
        subject: options.subject,
        template: options.template,
        status: 'SUCCESS',
        sentAt: new Date(),
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Log failure
      await this.logEmail({
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        template: options.template,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date(),
      });

      return false;
    }
  }

  // Log email activity
  private async logEmail(log: EmailLog) {
    // In production, you might want to save this to database
    console.log('Email log:', log);
  }

  // Send bulk emails
  async sendBulkEmails(
    recipients: string[],
    subject: string,
    template: string,
    baseData: any
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: recipient,
        subject,
        template,
        data: {
          ...baseData,
          recipientEmail: recipient,
        },
      });

      if (success) {
        successful.push(recipient);
      } else {
        failed.push(recipient);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { successful, failed };
  }

  // Email templates for specific events

  // Send welcome email
  async sendWelcomeEmail(userId: string, temporaryPassword?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.sendEmail({
      to: user.email,
      subject: 'CRM AUGU에 오신 것을 환영합니다!',
      template: 'welcome',
      data: {
        userName: user.name,
        email: user.email,
        temporaryPassword,
        loginUrl: `${process.env.WEBSITE_URL || 'http://localhost:5173'}/login`,
        helpUrl: `${process.env.WEBSITE_URL || 'http://localhost:5173'}/help`,
      },
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${process.env.WEBSITE_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: email,
      subject: '비밀번호 재설정 요청',
      template: 'password-reset',
      data: {
        resetUrl,
        expiryTime: '1시간',
      },
    });
  }

  // Send task assignment email
  async sendTaskAssignmentEmail(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
        createdByUser: true,
        project: true,
      },
    });

    if (!task || !task.assignedTo) {
      return false;
    }

    return this.sendEmail({
      to: task.assignedTo.email,
      subject: `새로운 태스크: ${task.title}`,
      template: 'task-assigned',
      data: {
        assigneeName: task.assignedTo.name,
        assignerName: task.createdByUser.name,
        taskTitle: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        projectName: task.project?.name,
        description: task.description,
        taskUrl: `${process.env.WEBSITE_URL || 'http://localhost:5173'}/tasks/${taskId}`,
      },
    });
  }

  // Send proposal status email
  async sendProposalStatusEmail(proposalId: string, isApproved: boolean) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        opportunity: {
          include: {
            company: true,
          },
        },
        approvedByUser: true,
        rejectedByUser: true,
        createdByUser: true,
      },
    });

    if (!proposal || !proposal.createdByUser) {
      return false;
    }

    const reviewer = isApproved ? proposal.approvedByUser : proposal.rejectedByUser;

    return this.sendEmail({
      to: proposal.createdByUser.email,
      subject: `제안서 ${isApproved ? '승인' : '거절'}: ${proposal.code}`,
      template: 'proposal-status',
      data: {
        userName: proposal.createdByUser.name,
        isApproved,
        proposalCode: proposal.code,
        proposalTitle: proposal.title,
        companyName: proposal.opportunity.company.name,
        amount: proposal.totalAmount,
        reviewerName: reviewer?.name,
        processedAt: isApproved ? proposal.approvedAt : proposal.rejectedAt,
        comments: proposal.rejectionReason,
        proposalUrl: `${process.env.WEBSITE_URL || 'http://localhost:5173'}/proposals/${proposalId}`,
      },
    });
  }

  // Send meeting reminder email
  async sendMeetingReminderEmail(meetingId: string, participantIds: string[]) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        organizer: true,
      },
    });

    if (!meeting) {
      return false;
    }

    const participants = await prisma.user.findMany({
      where: {
        id: { in: participantIds },
      },
    });

    const emails = participants.map(p => p.email);

    return this.sendEmail({
      to: emails,
      subject: `회의 알림: ${meeting.title}`,
      template: 'meeting-reminder',
      data: {
        meetingTitle: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        organizerName: meeting.organizer.name,
        agenda: meeting.agenda,
        meetingUrl: meeting.meetingUrl,
      },
    });
  }

  // Send report generation notification
  async sendReportGeneratedEmail(userId: string, reportName: string, reportId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    return this.sendEmail({
      to: user.email,
      subject: `리포트 생성 완료: ${reportName}`,
      template: 'report-generated',
      data: {
        userName: user.name,
        reportName,
        reportUrl: `${process.env.WEBSITE_URL || 'http://localhost:5173'}/reports/${reportId}`,
        downloadUrl: `${process.env.BASE_URL || 'http://localhost:8080'}/api/reports/${reportId}/download`,
      },
    });
  }

  // Send daily digest email
  async sendDailyDigestEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Get user's tasks due today
    const tasksDueToday = await prisma.task.count({
      where: {
        assignedToId: userId,
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { not: 'COMPLETED' },
      },
    });

    // Get unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    // Get upcoming meetings
    const upcomingMeetings = await prisma.meeting.count({
      where: {
        participants: {
          some: {
            internalParticipantId: userId,
          },
        },
        startTime: {
          gte: new Date(),
          lt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    return this.sendEmail({
      to: user.email,
      subject: `일일 요약 - ${new Date().toLocaleDateString('ko-KR')}`,
      template: 'daily-digest',
      data: {
        userName: user.name,
        tasksDueToday,
        unreadNotifications,
        upcomingMeetings,
        dashboardUrl: `${process.env.WEBSITE_URL || 'http://localhost:5173'}/dashboard`,
      },
    });
  }

  // Send system announcement
  async sendSystemAnnouncement(
    title: string,
    message: string,
    recipients: string[],
    priority: 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL'
  ) {
    return this.sendBulkEmails(
      recipients,
      `[시스템 공지] ${title}`,
      'system-announcement',
      {
        title,
        message,
        priority,
        announcementDate: new Date(),
      }
    );
  }

  // Test email connection
  async testEmailConnection(): Promise<boolean> {
    try {
      await emailTransporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  // Send test email
  async sendTestEmail(to: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'CRM AUGU 테스트 이메일',
      html: `
        <h2>테스트 이메일</h2>
        <p>이것은 CRM AUGU 시스템에서 발송된 테스트 이메일입니다.</p>
        <p>이메일이 정상적으로 수신되었다면, 이메일 설정이 올바르게 구성되었습니다.</p>
        <p>발송 시간: ${new Date().toLocaleString('ko-KR')}</p>
      `,
    });
  }
}

export const emailService = new EmailService();