import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateToken } from '../../src/utils/jwt';
import { hashPassword } from '../../src/utils/password';

const prisma = new PrismaClient();

describe('Complete Sales Workflow Integration', () => {
  let authToken: string;
  let userId: string;
  let companyId: string;
  let leadId: string;
  let opportunityId: string;
  let proposalId: string;
  let contractId: string;

  // Test user data
  const testUser = {
    email: 'sales@test.com',
    password: 'Test123!@#',
    name: 'Sales Manager',
    role: 'MANAGER',
  };

  beforeAll(async () => {
    // Clean up test data
    await prisma.$transaction([
      prisma.contract.deleteMany({ where: { createdBy: { email: testUser.email } } }),
      prisma.proposalApproval.deleteMany({}),
      prisma.proposalVersion.deleteMany({}),
      prisma.proposalItem.deleteMany({}),
      prisma.proposal.deleteMany({ where: { createdBy: { email: testUser.email } } }),
      prisma.opportunityActivity.deleteMany({}),
      prisma.opportunity.deleteMany({ where: { createdBy: { email: testUser.email } } }),
      prisma.leadActivity.deleteMany({}),
      prisma.lead.deleteMany({ where: { createdBy: { email: testUser.email } } }),
      prisma.contact.deleteMany({ where: { createdBy: { email: testUser.email } } }),
      prisma.companyBranch.deleteMany({ where: { createdBy: { email: testUser.email } } }),
      prisma.company.deleteMany({ where: { createdBy: { email: testUser.email } } }),
      prisma.user.deleteMany({ where: { email: testUser.email } }),
    ]);

    // Create test user
    const hashedPassword = await hashPassword(testUser.password);
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
        name: testUser.name,
        role: testUser.role as any,
        isActive: true,
      },
    });

    userId = user.id;
    authToken = generateToken({ id: user.id, email: user.email, role: user.role });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.$transaction([
      prisma.contract.deleteMany({ where: { createdBy: userId } }),
      prisma.proposalApproval.deleteMany({}),
      prisma.proposalVersion.deleteMany({}),
      prisma.proposalItem.deleteMany({}),
      prisma.proposal.deleteMany({ where: { createdBy: userId } }),
      prisma.opportunityActivity.deleteMany({}),
      prisma.opportunity.deleteMany({ where: { createdBy: userId } }),
      prisma.leadActivity.deleteMany({}),
      prisma.lead.deleteMany({ where: { createdBy: userId } }),
      prisma.contact.deleteMany({ where: { createdBy: userId } }),
      prisma.companyBranch.deleteMany({ where: { createdBy: userId } }),
      prisma.company.deleteMany({ where: { createdBy: userId } }),
      prisma.user.deleteMany({ where: { id: userId } }),
    ]);

    await prisma.$disconnect();
  });

  describe('Step 1: Company and Contact Creation', () => {
    it('should create a company with branch and contact', async () => {
      // Create company
      const companyRes = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Corporation',
          industry: 'Technology',
          size: 'MEDIUM',
          website: 'https://testcorp.com',
          taxId: '123-45-6789',
        });

      expect(companyRes.status).toBe(201);
      expect(companyRes.body.success).toBe(true);
      expect(companyRes.body.data).toHaveProperty('id');
      companyId = companyRes.body.data.id;

      // Create branch
      const branchRes = await request(app)
        .post(`/api/companies/${companyId}/branches`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Main Office',
          address: '123 Business St',
          city: 'Seoul',
          country: 'South Korea',
          isHeadquarters: true,
        });

      expect(branchRes.status).toBe(201);
      const branchId = branchRes.body.data.id;

      // Create contact
      const contactRes = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@testcorp.com',
          phone: '+82-10-1234-5678',
          position: 'CTO',
          companyId: companyId,
          branchId: branchId,
        });

      expect(contactRes.status).toBe(201);
      expect(contactRes.body.data.email).toBe('john.doe@testcorp.com');
    });
  });

  describe('Step 2: Lead Management', () => {
    it('should create and qualify a lead', async () => {
      // Create lead
      const leadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: companyId,
          title: 'Enterprise CRM Solution',
          source: 'WEBSITE',
          status: 'NEW',
          estimatedValue: 100000,
          description: 'Looking for comprehensive CRM solution',
        });

      expect(leadRes.status).toBe(201);
      expect(leadRes.body.success).toBe(true);
      leadId = leadRes.body.data.id;

      // Add activity to lead
      const activityRes = await request(app)
        .post(`/api/leads/${leadId}/activities`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'CALL',
          subject: 'Initial Discovery Call',
          description: 'Discussed requirements and budget',
          outcome: 'Positive - ready to move forward',
        });

      expect(activityRes.status).toBe(201);

      // Qualify lead
      const qualifyRes = await request(app)
        .patch(`/api/leads/${leadId}/qualify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          score: 85,
          notes: 'High potential customer with clear requirements',
        });

      expect(qualifyRes.status).toBe(200);
      expect(qualifyRes.body.data.status).toBe('QUALIFIED');
    });

    it('should convert qualified lead to opportunity', async () => {
      const convertRes = await request(app)
        .post(`/api/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          opportunityName: 'Enterprise CRM Implementation',
          stage: 'QUALIFICATION',
          probability: 30,
          expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        });

      expect(convertRes.status).toBe(201);
      expect(convertRes.body.success).toBe(true);
      expect(convertRes.body.data).toHaveProperty('opportunityId');
      opportunityId = convertRes.body.data.opportunityId;
    });
  });

  describe('Step 3: Opportunity Management', () => {
    it('should update opportunity through stages', async () => {
      // Move to PROPOSAL stage
      const updateRes = await request(app)
        .patch(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stage: 'PROPOSAL',
          probability: 60,
          amount: 120000,
          notes: 'Customer requested formal proposal',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.stage).toBe('PROPOSAL');

      // Add competitor information
      const competitorRes = await request(app)
        .post(`/api/opportunities/${opportunityId}/competitors`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Competitor CRM Inc',
          strengths: 'Lower price, local presence',
          weaknesses: 'Less features, poor support',
          strategy: 'Emphasize our superior features and support',
        });

      expect(competitorRes.status).toBe(201);
    });
  });

  describe('Step 4: Proposal Creation and Approval', () => {
    // TODO(human): Implement multi-level approval tests based on amount thresholds
    // Requirements:
    // - Under $50K: Manager approval only
    // - $50K-$200K: Director approval required
    // - Over $200K: CEO approval required
    // Test cases to implement:
    // 1. Verify correct approvers are required based on amount
    // 2. Test lower-level approver cannot approve high-value proposals
    // 3. Test approval delegation scenarios
    // 4. Test that modifying proposal invalidates previous approvals
    
    it('should create a proposal from opportunity', async () => {
      const proposalRes = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          opportunityId: opportunityId,
          title: 'Enterprise CRM Solution Proposal',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          items: [
            {
              description: 'CRM Software License (100 users)',
              quantity: 100,
              unitPrice: 500,
              discountPercent: 10,
            },
            {
              description: 'Implementation Services',
              quantity: 200,
              unitPrice: 150,
              discountPercent: 0,
            },
            {
              description: 'Training (5 days)',
              quantity: 5,
              unitPrice: 2000,
              discountPercent: 5,
            },
          ],
          terms: 'Net 30 days',
          paymentTerms: '50% upfront, 50% on completion',
        });

      expect(proposalRes.status).toBe(201);
      expect(proposalRes.body.success).toBe(true);
      proposalId = proposalRes.body.data.id;

      // Verify calculations
      const proposal = proposalRes.body.data;
      expect(proposal.subtotal).toBe(85000); // (100*500) + (200*150) + (5*2000)
      expect(proposal.totalDiscount).toBe(5500); // 5000 + 0 + 500
      expect(proposal.total).toBe(79500); // 85000 - 5500
    });

    it('should submit proposal for approval', async () => {
      const submitRes = await request(app)
        .post(`/api/proposals/${proposalId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Please review and approve',
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.status).toBe('PENDING_APPROVAL');
    });

    it('should approve proposal', async () => {
      // First check required approvers
      const checkRes = await request(app)
        .get(`/api/proposals/${proposalId}/check-approvers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(checkRes.status).toBe(200);

      // Approve proposal
      const approveRes = await request(app)
        .post(`/api/proposals/${proposalId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comments: 'Approved - good terms',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');
    });

    it('should send proposal to customer', async () => {
      const sendRes = await request(app)
        .post(`/api/proposals/${proposalId}/send`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          recipientEmail: 'john.doe@testcorp.com',
          subject: 'Your CRM Solution Proposal',
          message: 'Please find attached our proposal for your CRM implementation.',
        });

      expect(sendRes.status).toBe(200);
      expect(sendRes.body.data.status).toBe('SENT');
    });

    it('should record customer acceptance', async () => {
      const responseRes = await request(app)
        .post(`/api/proposals/${proposalId}/customer-response`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          response: 'ACCEPTED',
          comments: 'Looks good, let\'s proceed',
          signedBy: 'John Doe',
          signedDate: new Date(),
        });

      expect(responseRes.status).toBe(200);
      expect(responseRes.body.data.status).toBe('ACCEPTED');

      // Verify opportunity stage updated
      const oppRes = await request(app)
        .get(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(oppRes.body.data.stage).toBe('NEGOTIATION');
    });
  });

  describe('Step 5: Contract Generation', () => {
    it('should generate contract from accepted proposal', async () => {
      const contractRes = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          proposalId: proposalId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          type: 'SERVICE',
          autoRenew: true,
          renewalTerms: 'Annual renewal with 5% increase',
        });

      expect(contractRes.status).toBe(201);
      expect(contractRes.body.success).toBe(true);
      contractId = contractRes.body.data.id;

      // Verify opportunity closed won
      const oppRes = await request(app)
        .get(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(oppRes.body.data.stage).toBe('CLOSED_WON');
    });
  });

  describe('Step 6: Pipeline Analytics', () => {
    it('should provide accurate pipeline metrics', async () => {
      const metricsRes = await request(app)
        .get('/api/sales-pipeline/metrics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.success).toBe(true);

      const metrics = metricsRes.body.data;
      expect(metrics).toHaveProperty('totalOpportunities');
      expect(metrics).toHaveProperty('totalValue');
      expect(metrics).toHaveProperty('averageDealSize');
      expect(metrics).toHaveProperty('conversionRate');
      expect(metrics).toHaveProperty('averageSalesCycle');
    });

    it('should provide proposal analytics', async () => {
      const analyticsRes = await request(app)
        .get('/api/sales-pipeline/proposals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.success).toBe(true);

      const analytics = analyticsRes.body.data;
      expect(analytics).toHaveProperty('totalProposals');
      expect(analytics).toHaveProperty('acceptanceRate');
      expect(analytics).toHaveProperty('averageApprovalTime');
      expect(analytics).toHaveProperty('totalValue');
    });

    it('should provide funnel analysis', async () => {
      const funnelRes = await request(app)
        .get('/api/sales-pipeline/funnel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(funnelRes.status).toBe(200);
      expect(funnelRes.body.success).toBe(true);

      const funnel = funnelRes.body.data;
      expect(funnel).toHaveProperty('stages');
      expect(Array.isArray(funnel.stages)).toBe(true);
      
      // Verify funnel has correct stage progression
      const stages = funnel.stages;
      expect(stages.find((s: any) => s.stage === 'QUALIFICATION')).toBeDefined();
      expect(stages.find((s: any) => s.stage === 'PROPOSAL')).toBeDefined();
      expect(stages.find((s: any) => s.stage === 'CLOSED_WON')).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should prevent duplicate lead conversion', async () => {
      const convertRes = await request(app)
        .post(`/api/leads/${leadId}/convert`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          opportunityName: 'Duplicate Opportunity',
        });

      expect(convertRes.status).toBe(400);
      expect(convertRes.body.error).toContain('already converted');
    });

    it('should validate proposal items', async () => {
      const invalidProposalRes = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          opportunityId: opportunityId,
          title: 'Invalid Proposal',
          items: [
            {
              description: 'Invalid Item',
              quantity: -1, // Invalid quantity
              unitPrice: 100,
            },
          ],
        });

      expect(invalidProposalRes.status).toBe(400);
      expect(invalidProposalRes.body.error).toContain('quantity');
    });

    it('should enforce approval limits', async () => {
      // Create high-value proposal
      const highValueProposalRes = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          opportunityId: opportunityId,
          title: 'High Value Proposal',
          items: [
            {
              description: 'Enterprise Package',
              quantity: 1,
              unitPrice: 1000000, // $1M
            },
          ],
        });

      expect(highValueProposalRes.status).toBe(201);
      const highValueProposalId = highValueProposalRes.body.data.id;

      // Check required approvers - should require multiple levels
      const checkRes = await request(app)
        .get(`/api/proposals/${highValueProposalId}/check-approvers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.requiredApprovers.length).toBeGreaterThan(1);
    });

    it('should handle concurrent updates correctly', async () => {
      // Simulate concurrent opportunity updates
      const updates = [];
      for (let i = 0; i < 5; i++) {
        updates.push(
          request(app)
            .patch(`/api/opportunities/${opportunityId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              probability: 70 + i,
              notes: `Concurrent update ${i}`,
            })
        );
      }

      const results = await Promise.all(updates);
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Try to delete company with active opportunity
      const deleteRes = await request(app)
        .delete(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(400);
      expect(deleteRes.body.error).toContain('active opportunities');
    });

    it('should cascade soft deletes properly', async () => {
      // Soft delete opportunity
      const deleteOppRes = await request(app)
        .delete(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteOppRes.status).toBe(200);

      // Verify proposal is also soft deleted
      const proposalRes = await request(app)
        .get(`/api/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(proposalRes.status).toBe(404);
    });

    it('should track audit trail', async () => {
      // Get proposal history
      const historyRes = await request(app)
        .get(`/api/proposals/${proposalId}/history`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyRes.status).toBe(200);
      expect(Array.isArray(historyRes.body.data)).toBe(true);
      expect(historyRes.body.data.length).toBeGreaterThan(0);
    });
  });
});