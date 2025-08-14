import prisma from '../config/database';
import { ContactRole } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors';

export interface ContactSegmentCriteria {
  role?: ContactRole[];
  department?: string[];
  isPrimary?: boolean;
  hasRecentActivity?: boolean;
  branchId?: string;
  companyId?: string;
}

export interface ContactEngagementMetrics {
  totalInteractions: number;
  lastInteractionDate: Date | null;
  preferredChannel: string;
  responseRate: number;
  engagementScore: number;
}

export interface ContactInfluenceScore {
  decisionMakingPower: number;
  internalInfluence: number;
  externalNetworkSize: number;
  overallScore: number;
}

export class ContactManagementService {
  // Enhanced contact search with advanced filtering
  async searchContacts(criteria: {
    search?: string;
    companyId?: string;
    branchId?: string;
    role?: ContactRole[];
    department?: string[];
    isPrimary?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {
      deletedAt: null,
    };

    if (criteria.search) {
      where.OR = [
        { firstName: { contains: criteria.search, mode: 'insensitive' } },
        { lastName: { contains: criteria.search, mode: 'insensitive' } },
        { email: { contains: criteria.search, mode: 'insensitive' } },
        { phone: { contains: criteria.search, mode: 'insensitive' } },
        { mobile: { contains: criteria.search, mode: 'insensitive' } },
      ];
    }

    if (criteria.companyId) {
      where.branch = {
        companyId: criteria.companyId,
      };
    }

    if (criteria.branchId) {
      where.branchId = criteria.branchId;
    }

    if (criteria.role && criteria.role.length > 0) {
      where.roleType = { in: criteria.role };
    }

    if (criteria.department && criteria.department.length > 0) {
      where.department = { in: criteria.department };
    }

    if (criteria.isPrimary !== undefined) {
      where.isPrimary = criteria.isPrimary;
    }

    // Tags not available in Contact model currently

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        branch: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                tier: true,
              },
            },
          },
        },
        _count: {
          select: {
            activities: true,
          },
        },
      },
      take: criteria.limit || 50,
      skip: criteria.offset || 0,
      orderBy: [
        { isPrimary: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return contacts;
  }

  // Calculate contact engagement metrics
  async calculateEngagementMetrics(contactId: string): Promise<ContactEngagementMetrics> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Get activities separately
    const activities = await prisma.activity.findMany({
      where: { contactId },
      orderBy: { startTime: 'desc' },
    });

    const totalInteractions = activities.length;
    const lastInteractionDate = activities[0]?.startTime || null;
    
    // Analyze activity types to determine preferred channel
    const channelCounts: Record<string, number> = {};
    activities.forEach(activity => {
      const channel = activity.type || 'OTHER';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });
    
    const preferredChannel = Object.entries(channelCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'EMAIL';

    // Calculate response rate (placeholder - would need actual response tracking)
    const responseRate = totalInteractions > 0 ? 0.75 : 0;

    // Calculate engagement score (0-100)
    const recencyScore = lastInteractionDate 
      ? Math.max(0, 100 - (Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const frequencyScore = Math.min(100, totalInteractions * 10);
    const engagementScore = Math.round((recencyScore + frequencyScore) / 2);

    return {
      totalInteractions,
      lastInteractionDate,
      preferredChannel,
      responseRate,
      engagementScore,
    };
  }

  // Calculate contact influence score
  async calculateInfluenceScore(contactId: string): Promise<ContactInfluenceScore> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        branch: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Decision making power based on role and position
    let decisionMakingPower = 50;
    if (contact.roleType === ContactRole.DECISION_MAKER) {
      decisionMakingPower = 100;
    } else if (contact.roleType === ContactRole.INFLUENCER) {
      decisionMakingPower = 70;
    } else if (contact.roleType === ContactRole.CHAMPION) {
      decisionMakingPower = 60;
    }

    // Adjust based on position keywords
    const position = contact.position?.toLowerCase() || '';
    if (position.includes('ceo') || position.includes('president')) {
      decisionMakingPower = Math.min(100, decisionMakingPower + 30);
    } else if (position.includes('director') || position.includes('vp')) {
      decisionMakingPower = Math.min(100, decisionMakingPower + 20);
    } else if (position.includes('manager')) {
      decisionMakingPower = Math.min(100, decisionMakingPower + 10);
    }

    // Internal influence based on primary contact status and activity
    const internalInfluence = contact.isPrimary ? 80 : 50;

    // External network size (placeholder - would need LinkedIn integration)
    const externalNetworkSize = 50;

    // Calculate overall score
    const overallScore = Math.round(
      decisionMakingPower * 0.5 +
      internalInfluence * 0.3 +
      externalNetworkSize * 0.2
    );

    return {
      decisionMakingPower,
      internalInfluence,
      externalNetworkSize,
      overallScore,
    };
  }

  // Create contact relationship map
  async getContactRelationshipMap(contactId: string) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        branch: {
          include: {
            contacts: {
              where: { 
                deletedAt: null,
                NOT: { id: contactId },
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                department: true,
                roleType: true,
                isPrimary: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Group contacts by department
    const departmentMap: Record<string, any[]> = {};
    contact.branch.contacts.forEach(relatedContact => {
      const dept = relatedContact.department || 'Other';
      if (!departmentMap[dept]) {
        departmentMap[dept] = [];
      }
      departmentMap[dept].push(relatedContact);
    });

    return {
      contact: {
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        position: contact.position,
        department: contact.department,
        role: contact.roleType,
      },
      company: contact.branch.company,
      relationships: departmentMap,
      totalContacts: contact.branch.contacts.length,
    };
  }

  // Bulk update contact preferences
  async updateContactPreferences(
    contactId: string,
    preferences: {
      preferredChannel?: string;
      bestTimeToContact?: string;
      doNotContact?: boolean;
      language?: string;
      timezone?: string;
    }
  ) {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundError('Contact not found');
    }

    // Store preferences in notes field for now (since separate preference fields don't exist)
    const prefNotes = [];
    
    if (preferences.preferredChannel) {
      prefNotes.push(`Preferred Channel: ${preferences.preferredChannel}`);
    }
    if (preferences.bestTimeToContact) {
      prefNotes.push(`Best Time: ${preferences.bestTimeToContact}`);
    }
    if (preferences.doNotContact) {
      prefNotes.push('DO NOT CONTACT');
    }
    if (preferences.language) {
      prefNotes.push(`Language: ${preferences.language}`);
    }
    if (preferences.timezone) {
      prefNotes.push(`Timezone: ${preferences.timezone}`);
    }
    
    const updatedNotes = prefNotes.length > 0 
      ? `[PREFERENCES]\n${prefNotes.join('\n')}\n\n${contact.notes || ''}`
      : contact.notes;
    
    return prisma.contact.update({
      where: { id: contactId },
      data: {
        notes: updatedNotes,
        preferredContactMethod: preferences.preferredChannel,
        updatedAt: new Date(),
      },
    });
  }

  // Get contact communication history
  async getContactCommunicationHistory(contactId: string, options?: {
    limit?: number;
    offset?: number;
    type?: string[];
  }) {
    const activities = await prisma.activity.findMany({
      where: {
        contactId,
        type: options?.type ? { in: options.type } : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    const notes = await prisma.note.findMany({
      where: { contactId },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    // Combine and sort by date
    const history = [
      ...activities.map(a => ({
        type: 'activity',
        id: a.id,
        date: a.startTime,
        title: a.title,
        description: a.description,
        activityType: a.type,
        user: a.user,
      })),
      ...notes.map(n => ({
        type: 'note',
        id: n.id,
        date: n.createdAt,
        title: 'Note',
        description: n.content,
        activityType: 'NOTE',
        user: n.createdByUser,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return history.slice(0, options?.limit || 20);
  }

  // Identify duplicate contacts
  async findDuplicateContacts(companyId?: string) {
    // Find contacts with same email
    const emailDuplicates = await prisma.$queryRaw`
      SELECT email, array_agg(id) as contact_ids, COUNT(*) as count
      FROM contacts
      WHERE deleted_at IS NULL
        AND email IS NOT NULL
        ${companyId ? prisma.$queryRaw`AND branch_id IN (SELECT id FROM branches WHERE company_id = ${companyId})` : prisma.$queryRaw``}
      GROUP BY email
      HAVING COUNT(*) > 1
    `;

    // Find contacts with same phone
    const phoneDuplicates = await prisma.$queryRaw`
      SELECT mobile, array_agg(id) as contact_ids, COUNT(*) as count
      FROM contacts
      WHERE deleted_at IS NULL
        AND mobile IS NOT NULL
        ${companyId ? prisma.$queryRaw`AND branch_id IN (SELECT id FROM branches WHERE company_id = ${companyId})` : prisma.$queryRaw``}
      GROUP BY mobile
      HAVING COUNT(*) > 1
    `;

    return {
      emailDuplicates,
      phoneDuplicates,
    };
  }

  // Merge duplicate contacts
  async mergeContacts(primaryContactId: string, duplicateContactIds: string[]) {
    const primaryContact = await prisma.contact.findUnique({
      where: { id: primaryContactId },
    });

    if (!primaryContact) {
      throw new NotFoundError('Primary contact not found');
    }

    // Verify all duplicate contacts exist
    const duplicateContacts = await prisma.contact.findMany({
      where: { id: { in: duplicateContactIds } },
    });

    if (duplicateContacts.length !== duplicateContactIds.length) {
      throw new BadRequestError('Some duplicate contacts not found');
    }

    // Start transaction to merge contacts
    return prisma.$transaction(async (tx) => {
      // Move all activities to primary contact
      await tx.activity.updateMany({
        where: { contactId: { in: duplicateContactIds } },
        data: { contactId: primaryContactId },
      });

      // Move all notes to primary contact
      await tx.note.updateMany({
        where: { contactId: { in: duplicateContactIds } },
        data: { contactId: primaryContactId },
      });

      // Update primary contact with merged data
      await tx.contact.update({
        where: { id: primaryContactId },
        data: {
          // Keep the most recent non-null values
          phone: primaryContact.phone || duplicateContacts.find(c => c.phone)?.phone,
          mobile: primaryContact.mobile || duplicateContacts.find(c => c.mobile)?.mobile,
          linkedinUrl: primaryContact.linkedinUrl || duplicateContacts.find(c => c.linkedinUrl)?.linkedinUrl,
        },
      });

      // Soft delete duplicate contacts
      await tx.contact.updateMany({
        where: { id: { in: duplicateContactIds } },
        data: {
          deletedAt: new Date(),
          deletedBy: 'merge_process',
        },
      });

      return {
        mergedContactId: primaryContactId,
        mergedCount: duplicateContactIds.length,
      };
    });
  }

  // Export contacts to CSV
  async exportContactsToCSV(criteria: {
    companyId?: string;
    branchId?: string;
    role?: ContactRole[];
  }) {
    const where: any = { deletedAt: null };
    
    if (criteria.companyId) {
      where.branch = { companyId: criteria.companyId };
    }
    
    if (criteria.branchId) {
      where.branchId = criteria.branchId;
    }
    
    if (criteria.role && criteria.role.length > 0) {
      where.roleType = { in: criteria.role };
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        branch: {
          include: {
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { branch: { company: { name: 'asc' } } },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    // Convert to CSV format
    const headers = [
      'Company',
      'Branch',
      'First Name',
      'Last Name',
      'Position',
      'Department',
      'Email',
      'Phone',
      'Mobile',
      'Role',
      'Is Primary',
      'LinkedIn',
      'Notes',
    ];

    const rows = contacts.map(contact => [
      contact.branch.company.name,
      contact.branch.name,
      contact.firstName,
      contact.lastName,
      contact.position || '',
      contact.department || '',
      contact.email || '',
      contact.phone || '',
      contact.mobile || '',
      contact.roleType || '',
      contact.isPrimary ? 'Yes' : 'No',
      contact.linkedinUrl || '',
      contact.notes || '',
    ]);

    return {
      headers,
      rows,
      totalCount: contacts.length,
    };
  }
}

export const contactManagementService = new ContactManagementService();