import { Request, Response, NextFunction } from 'express';
import { contactManagementService } from '../services/contact-management.service';
import { ContactRole } from '@prisma/client';

// Search contacts with advanced filtering
export const searchContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      companyId,
      branchId,
      role,
      department,
      isPrimary,
      limit = 50,
      offset = 0,
    } = req.query;

    const contacts = await contactManagementService.searchContacts({
      search: search as string,
      companyId: companyId as string,
      branchId: branchId as string,
      role: role ? (Array.isArray(role) ? role : [role]) as ContactRole[] : undefined,
      department: department ? (Array.isArray(department) ? department : [department]) as string[] : undefined,
      isPrimary: isPrimary ? isPrimary === 'true' : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: contacts,
      meta: {
        timestamp: new Date().toISOString(),
        count: contacts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get contact engagement metrics
export const getContactEngagementMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactId } = req.params;
    const metrics = await contactManagementService.calculateEngagementMetrics(contactId);

    res.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get contact influence score
export const getContactInfluenceScore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactId } = req.params;
    const score = await contactManagementService.calculateInfluenceScore(contactId);

    res.json({
      success: true,
      data: score,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get contact relationship map
export const getContactRelationshipMap = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactId } = req.params;
    const relationshipMap = await contactManagementService.getContactRelationshipMap(contactId);

    res.json({
      success: true,
      data: relationshipMap,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update contact preferences
export const updateContactPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactId } = req.params;
    const preferences = req.body;

    const updatedContact = await contactManagementService.updateContactPreferences(
      contactId,
      {
        preferredChannel: preferences.preferredChannel,
        bestTimeToContact: preferences.bestTimeToContact,
        doNotContact: preferences.doNotContact,
        language: preferences.language,
        timezone: preferences.timezone,
      }
    );

    res.json({
      success: true,
      data: updatedContact,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get contact communication history
export const getContactCommunicationHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contactId } = req.params;
    const { limit = 20, offset = 0, type } = req.query;

    const history = await contactManagementService.getContactCommunicationHistory(
      contactId,
      {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        type: type ? (Array.isArray(type) ? type : [type]) as string[] : undefined,
      }
    );

    res.json({
      success: true,
      data: history,
      meta: {
        timestamp: new Date().toISOString(),
        count: history.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Find duplicate contacts
export const findDuplicateContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.query;
    const duplicates = await contactManagementService.findDuplicateContacts(
      companyId as string
    );

    res.json({
      success: true,
      data: duplicates,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Merge duplicate contacts
export const mergeContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { primaryContactId, duplicateContactIds } = req.body;

    if (!primaryContactId || !duplicateContactIds || !Array.isArray(duplicateContactIds)) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
      });
      return;
    }

    const result = await contactManagementService.mergeContacts(
      primaryContactId,
      duplicateContactIds
    );

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export contacts to CSV
export const exportContactsToCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId, branchId, role } = req.query;

    const csvData = await contactManagementService.exportContactsToCSV({
      companyId: companyId as string,
      branchId: branchId as string,
      role: role ? (Array.isArray(role) ? role : [role]) as ContactRole[] : undefined,
    });

    // Convert to CSV string
    const csvContent = [
      csvData.headers.join(','),
      ...csvData.rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};