import { Router } from 'express';
import { authenticate, authorizeByTier } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { UserTier } from '@prisma/client';
import * as companyController from '../controllers/company.controller';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createCompanySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    businessNumber: z.string().optional(),
    representative: z.string().optional(),
    industryId: z.string().uuid().optional(),
    companySize: z.enum(['MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
    annualRevenue: z.number().optional(),
    employeeCount: z.number().optional(),
    fiscalYearEnd: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
    status: z.enum(['PROSPECT', 'CUSTOMER', 'PARTNER', 'INACTIVE']).optional(),
    creditLimit: z.number().optional(),
    paymentTerms: z.number().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.any().optional(),
    accountManagerId: z.string().uuid().optional(),
  }),
});

const updateCompanySchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(200).optional(),
    businessNumber: z.string().optional(),
    representative: z.string().optional(),
    industryId: z.string().uuid().optional(),
    companySize: z.enum(['MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
    annualRevenue: z.number().optional(),
    employeeCount: z.number().optional(),
    fiscalYearEnd: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
    status: z.enum(['PROSPECT', 'CUSTOMER', 'PARTNER', 'INACTIVE']).optional(),
    creditLimit: z.number().optional(),
    paymentTerms: z.number().optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.any().optional(),
    accountManagerId: z.string().uuid().optional(),
  }),
});

const createBranchSchema = z.object({
  body: z.object({
    companyId: z.string().uuid(),
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(200),
    branchType: z.enum(['HEADQUARTERS', 'BRANCH', 'FACTORY', 'WAREHOUSE', 'OFFICE']).optional(),
    addressStreet: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressZip: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email().optional(),
    managerName: z.string().optional(),
    managerPhone: z.string().optional(),
    managerEmail: z.string().email().optional(),
    operatingHours: z.string().optional(),
    customFields: z.any().optional(),
  }),
});

const updateBranchSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(200).optional(),
    branchType: z.enum(['HEADQUARTERS', 'BRANCH', 'FACTORY', 'WAREHOUSE', 'OFFICE']).optional(),
    addressStreet: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    addressZip: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email().optional(),
    managerName: z.string().optional(),
    managerPhone: z.string().optional(),
    managerEmail: z.string().email().optional(),
    operatingHours: z.string().optional(),
    customFields: z.any().optional(),
  }),
});

const createContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    position: z.string().optional(),
    department: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    isPrimary: z.boolean().optional(),
    birthDate: z.string().optional(),
    preferredContactMethod: z.string().optional(),
    newsletter: z.boolean().optional(),
    notes: z.string().optional(),
    customFields: z.any().optional(),
    userId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional(),
  }),
});

const updateContactSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    isPrimary: z.boolean().optional(),
    birthDate: z.string().optional(),
    preferredContactMethod: z.string().optional(),
    newsletter: z.boolean().optional(),
    notes: z.string().optional(),
    customFields: z.any().optional(),
    userId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional(),
  }),
});

// Company routes
router.get(
  '/',
  authenticate,
  companyController.getCompanies
);

router.get(
  '/:id',
  authenticate,
  companyController.getCompanyById
);

router.post(
  '/',
  authenticate,
  validate(createCompanySchema),
  companyController.createCompany
);

router.patch(
  '/:id',
  authenticate,
  validate(updateCompanySchema),
  companyController.updateCompany
);

router.delete(
  '/:id',
  authenticate,
  authorizeByTier(UserTier.MANAGER, UserTier.EXECUTIVE),
  companyController.deleteCompany
);

// Branch routes
router.post(
  '/branches',
  authenticate,
  validate(createBranchSchema),
  companyController.createBranch
);

router.get(
  '/:companyId/branches',
  authenticate,
  companyController.getBranches
);

router.patch(
  '/branches/:id',
  authenticate,
  validate(updateBranchSchema),
  companyController.updateBranch
);

router.delete(
  '/branches/:id',
  authenticate,
  authorizeByTier(UserTier.MANAGER, UserTier.EXECUTIVE),
  companyController.deleteBranch
);

// Contact routes
router.post(
  '/contacts',
  authenticate,
  validate(createContactSchema),
  companyController.createContact
);

router.get(
  '/contacts',
  authenticate,
  companyController.getContacts
);

router.patch(
  '/contacts/:id',
  authenticate,
  validate(updateContactSchema),
  companyController.updateContact
);

router.delete(
  '/contacts/:id',
  authenticate,
  authorizeByTier(UserTier.MANAGER, UserTier.EXECUTIVE),
  companyController.deleteContact
);

export default router;