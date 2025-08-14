import { Request, Response } from 'express';
import { emailService } from '../services/email.service';

// Send email
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, template, data, html, text, cc, bcc, attachments } = req.body;

    if (!to || !subject || (!template && !html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and either template or html/text',
      });
    }

    const success = await emailService.sendEmail({
      to,
      subject,
      template,
      data,
      html,
      text,
      cc,
      bcc,
      attachments,
    });

    if (success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email',
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
    });
  }
};

// Send bulk emails
export const sendBulkEmails = async (req: Request, res: Response) => {
  try {
    const { recipients, subject, template, data } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required',
      });
    }

    if (!subject || !template) {
      return res.status(400).json({
        success: false,
        error: 'Subject and template are required',
      });
    }

    const result = await emailService.sendBulkEmails(
      recipients,
      subject,
      template,
      data || {}
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk emails',
    });
  }
};

// Send test email
export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required',
      });
    }

    const success = await emailService.sendTestEmail(to);

    if (success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
    });
  }
};

// Test email connection
export const testEmailConnection = async (req: Request, res: Response) => {
  try {
    const success = await emailService.testEmailConnection();

    if (success) {
      res.json({
        success: true,
        message: 'Email connection is working',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Email connection failed',
      });
    }
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email connection',
    });
  }
};

// Send welcome email
export const sendWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const { userId, temporaryPassword } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const success = await emailService.sendWelcomeEmail(userId, temporaryPassword);

    if (success) {
      res.json({
        success: true,
        message: 'Welcome email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send welcome email',
      });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to send welcome email',
    });
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (req: Request, res: Response) => {
  try {
    const { email, resetToken } = req.body;

    if (!email || !resetToken) {
      return res.status(400).json({
        success: false,
        error: 'Email and reset token are required',
      });
    }

    const success = await emailService.sendPasswordResetEmail(email, resetToken);

    if (success) {
      res.json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send password reset email',
      });
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send password reset email',
    });
  }
};

// Send task assignment email
export const sendTaskAssignmentEmail = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
      });
    }

    const success = await emailService.sendTaskAssignmentEmail(taskId);

    if (success) {
      res.json({
        success: true,
        message: 'Task assignment email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send task assignment email',
      });
    }
  } catch (error) {
    console.error('Error sending task assignment email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send task assignment email',
    });
  }
};

// Send proposal status email
export const sendProposalStatusEmail = async (req: Request, res: Response) => {
  try {
    const { proposalId, isApproved } = req.body;

    if (!proposalId || isApproved === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Proposal ID and approval status are required',
      });
    }

    const success = await emailService.sendProposalStatusEmail(proposalId, isApproved);

    if (success) {
      res.json({
        success: true,
        message: 'Proposal status email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send proposal status email',
      });
    }
  } catch (error) {
    console.error('Error sending proposal status email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send proposal status email',
    });
  }
};

// Send meeting reminder email
export const sendMeetingReminderEmail = async (req: Request, res: Response) => {
  try {
    const { meetingId, participantIds } = req.body;

    if (!meetingId || !participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({
        success: false,
        error: 'Meeting ID and participant IDs are required',
      });
    }

    const success = await emailService.sendMeetingReminderEmail(meetingId, participantIds);

    if (success) {
      res.json({
        success: true,
        message: 'Meeting reminder email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send meeting reminder email',
      });
    }
  } catch (error) {
    console.error('Error sending meeting reminder email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send meeting reminder email',
    });
  }
};

// Send report generated email
export const sendReportGeneratedEmail = async (req: Request, res: Response) => {
  try {
    const { userId, reportName, reportId } = req.body;

    if (!userId || !reportName || !reportId) {
      return res.status(400).json({
        success: false,
        error: 'User ID, report name, and report ID are required',
      });
    }

    const success = await emailService.sendReportGeneratedEmail(userId, reportName, reportId);

    if (success) {
      res.json({
        success: true,
        message: 'Report generated email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send report generated email',
      });
    }
  } catch (error) {
    console.error('Error sending report generated email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send report generated email',
    });
  }
};

// Send daily digest email
export const sendDailyDigestEmail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const success = await emailService.sendDailyDigestEmail(userId);

    if (success) {
      res.json({
        success: true,
        message: 'Daily digest email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send daily digest email',
      });
    }
  } catch (error) {
    console.error('Error sending daily digest email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send daily digest email',
    });
  }
};

// Send system announcement
export const sendSystemAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, message, recipients, priority } = req.body;

    if (!title || !message || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        error: 'Title, message, and recipients are required',
      });
    }

    const result = await emailService.sendSystemAnnouncement(
      title,
      message,
      recipients,
      priority || 'NORMAL'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error sending system announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send system announcement',
    });
  }
};