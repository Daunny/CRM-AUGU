import prisma from '../config/database';
import { ForbiddenError } from '../utils/errors';
import { UserRole } from '@prisma/client';

interface ApprovalLimit {
  role: UserRole;
  maxAmount: number;
}

interface ApprovalLevel {
  level: number;
  role: UserRole;
  minAmount: number;
  maxAmount: number;
  description: string;
}

export class AuthorizationService {
  private static approvalLimits: ApprovalLimit[] = [
    { role: 'VIEWER' as UserRole, maxAmount: 0 },           // No approval rights
    { role: 'OPERATOR' as UserRole, maxAmount: 10000000 },  // 10M KRW
    { role: 'MANAGER' as UserRole, maxAmount: 50000000 },   // 50M KRW  
    { role: 'ADMIN' as UserRole, maxAmount: Number.MAX_VALUE }, // No limit
  ];

  // Define approval hierarchy based on amounts
  private static approvalLevels: ApprovalLevel[] = [
    { 
      level: 1, 
      role: 'OPERATOR' as UserRole, 
      minAmount: 0, 
      maxAmount: 10000000,
      description: 'Operator approval for amounts up to 10M KRW'
    },
    { 
      level: 2, 
      role: 'MANAGER' as UserRole, 
      minAmount: 10000001, 
      maxAmount: 50000000,
      description: 'Manager approval for amounts 10M-50M KRW'
    },
    { 
      level: 3, 
      role: 'ADMIN' as UserRole, 
      minAmount: 50000001, 
      maxAmount: Number.MAX_VALUE,
      description: 'Executive approval for amounts over 50M KRW'
    },
  ];

  // Check if user can approve proposal based on amount
  static async canApproveProposal(userId: string, proposalId: string): Promise<boolean> {
    const [user, proposal] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          role: true,
          isActive: true 
        },
      }),
      prisma.proposal.findUnique({
        where: { id: proposalId },
        select: { 
          totalAmount: true,
          createdBy: true,
          status: true
        },
      }),
    ]);

    if (!user || !proposal) {
      return false;
    }

    // User must be active
    if (!user.isActive) {
      return false;
    }

    // User cannot approve their own proposal
    if (proposal.createdBy === userId) {
      return false;
    }

    // Check if user role has sufficient approval limit
    const userLimit = this.approvalLimits.find(limit => limit.role === user.role);
    if (!userLimit) {
      return false;
    }

    return proposal.totalAmount <= userLimit.maxAmount;
  }

  // Get approval limit for a specific role
  static getApprovalLimitForRole(role: UserRole): number {
    const limit = this.approvalLimits.find(l => l.role === role);
    return limit ? limit.maxAmount : 0;
  }

  // Validate if user has sufficient approval authority for the amount
  static async validateApprovalAuthority(userId: string, amount: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, firstName: true, lastName: true }
    });

    if (!user) {
      throw new ForbiddenError('User not found');
    }

    const userLimit = this.getApprovalLimitForRole(user.role as UserRole);
    
    if (amount > userLimit) {
      const formattedAmount = amount.toLocaleString('ko-KR');
      const formattedLimit = userLimit === Number.MAX_VALUE 
        ? 'unlimited' 
        : userLimit.toLocaleString('ko-KR');
      
      throw new ForbiddenError(
        `Insufficient approval authority. Your approval limit is ${formattedLimit} KRW, but this proposal amount is ${formattedAmount} KRW.`
      );
    }
  }

  // Get required approval levels based on amount
  static getRequiredApprovalLevels(amount: number): ApprovalLevel[] {
    // Find all approval levels that need to approve based on amount
    const requiredLevel = this.approvalLevels.find(
      level => amount >= level.minAmount && amount <= level.maxAmount
    );

    if (!requiredLevel) {
      // Default to highest level if amount exceeds all defined levels
      return [this.approvalLevels[this.approvalLevels.length - 1]];
    }

    // For hierarchical approval, might need multiple levels
    // For now, return just the required level
    return [requiredLevel];
  }

  // Get potential approvers for a given amount
  static async getApproversForAmount(amount: number): Promise<Array<{id: string, name: string, role: UserRole}>> {
    const requiredLevels = this.getRequiredApprovalLevels(amount);
    const requiredRoles = requiredLevels.map(level => level.role);

    const approvers = await prisma.user.findMany({
      where: {
        role: { in: requiredRoles },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: {
        role: 'asc', // Order by role hierarchy
      },
    });

    return approvers.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    }));
  }

  // Create approval workflow for a proposal
  static async createApprovalWorkflow(_proposalId: string, amount: number): Promise<string[]> {
    const approvers = await this.getApproversForAmount(amount);
    
    if (approvers.length === 0) {
      throw new ForbiddenError('No approvers found for this amount');
    }

    // For now, select the first approver at each required level
    // In production, this would use more sophisticated logic (round-robin, workload, etc.)
    const selectedApprovers = new Map<UserRole, string>();
    
    for (const approver of approvers) {
      if (!selectedApprovers.has(approver.role as UserRole)) {
        selectedApprovers.set(approver.role as UserRole, approver.id);
      }
    }

    return Array.from(selectedApprovers.values());
  }

  // Check if user has pending approval task
  static async hasPendingApproval(userId: string, proposalId: string): Promise<boolean> {
    const approval = await prisma.proposalApproval.findFirst({
      where: {
        proposalId,
        approverId: userId,
        status: 'PENDING',
      },
    });

    return !!approval;
  }

  // Check if user can modify proposal
  static async canModifyProposal(userId: string, proposalId: string): Promise<boolean> {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        createdBy: true,
        status: true,
        opportunityId: true,
      },
    });

    if (!proposal) {
      return false;
    }

    // Get opportunity to check account manager
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: proposal.opportunityId },
      select: { accountManagerId: true },
    });

    // Can modify if:
    // 1. User is the creator
    // 2. User is the account manager
    // 3. Proposal is still in DRAFT status
    return (
      proposal.status === 'DRAFT' &&
      (proposal.createdBy === userId || opportunity?.accountManagerId === userId)
    );
  }

  // Check if user can delete proposal
  static async canDeleteProposal(userId: string, proposalId: string): Promise<boolean> {
    const [user, proposal] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }),
      prisma.proposal.findUnique({
        where: { id: proposalId },
        select: {
          status: true,
          createdBy: true,
        },
      }),
    ]);

    if (!user || !proposal) {
      return false;
    }

    // Can delete if:
    // 1. User is ADMIN or MANAGER
    // 2. Proposal is in DRAFT or REJECTED status
    // 3. User is creator (for DRAFT only)
    if (user.role === 'ADMIN') {
      return true;
    }

    if (user.role === 'MANAGER') {
      return proposal.status === 'DRAFT' || proposal.status === 'REJECTED';
    }

    return proposal.status === 'DRAFT' && proposal.createdBy === userId;
  }

  // Validate user permission or throw error
  static async validatePermission(
    userId: string,
    action: 'approve' | 'modify' | 'delete',
    proposalId: string
  ): Promise<void> {
    let hasPermission = false;

    switch (action) {
      case 'approve':
        // First check if user has pending approval task
        const hasPending = await this.hasPendingApproval(userId, proposalId);
        if (!hasPending) {
          throw new ForbiddenError('You do not have a pending approval task for this proposal');
        }
        
        // Then validate approval authority based on amount
        const proposal = await prisma.proposal.findUnique({
          where: { id: proposalId },
          select: { totalAmount: true, createdBy: true }
        });
        
        if (!proposal) {
          throw new ForbiddenError('Proposal not found');
        }
        
        // Check if user is trying to approve their own proposal
        if (proposal.createdBy === userId) {
          throw new ForbiddenError('You cannot approve your own proposal');
        }
        
        // Validate approval authority for the amount
        await this.validateApprovalAuthority(userId, proposal.totalAmount);
        hasPermission = true;
        break;

      case 'modify':
        hasPermission = await this.canModifyProposal(userId, proposalId);
        break;

      case 'delete':
        hasPermission = await this.canDeleteProposal(userId, proposalId);
        break;
    }

    if (!hasPermission) {
      throw new ForbiddenError(`You do not have permission to ${action} this proposal`);
    }
  }
}

export const authorizationService = new AuthorizationService();