import { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service';
import { AuthRequest } from '../middlewares/auth';

// Company Controllers
export const createCompany = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const company = await companyService.createCompany(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: company,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      industry,
      size,
      isActive,
    } = req.query;

    const filter = {
      search: search as string,
      industry: industry as string,
      size: size as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    };

    const result = await companyService.getCompanies(
      filter,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      ...result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const company = await companyService.getCompanyById(id);

    res.json({
      success: true,
      data: company,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const company = await companyService.updateCompany(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: company,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await companyService.deleteCompany(id, req.user!.userId);

    res.json({
      success: true,
      message: 'Company deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Branch Controllers
export const createBranch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const branch = await companyService.createBranch(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: branch,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBranches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;
    const branches = await companyService.getBranches(companyId);

    res.json({
      success: true,
      data: branches,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const branch = await companyService.updateBranch(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: branch,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBranch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await companyService.deleteBranch(id, req.user!.userId);

    res.json({
      success: true,
      message: 'Branch deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Contact Controllers
export const createContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const contact = await companyService.createContact(
      req.body,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      data: contact,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId, search, page = '1', limit = '20' } = req.query;
    
    const result = await companyService.getContacts(
      {
        branchId: branchId as string,
        search: search as string,
      },
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      ...result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const contact = await companyService.updateContact(
      id,
      req.body,
      req.user!.userId
    );

    res.json({
      success: true,
      data: contact,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await companyService.deleteContact(id, req.user!.userId);

    res.json({
      success: true,
      message: 'Contact deleted successfully',
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};