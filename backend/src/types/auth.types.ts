export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions?: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface DecodedToken extends JWTPayload {
  iat: number;
  exp: number;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: TokenPair;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

export enum Permission {
  // Company permissions
  CREATE_COMPANY = 'create:company',
  READ_COMPANY = 'read:company',
  UPDATE_COMPANY = 'update:company',
  DELETE_COMPANY = 'delete:company',
  
  // Lead permissions
  CREATE_LEAD = 'create:lead',
  READ_LEAD = 'read:lead',
  UPDATE_LEAD = 'update:lead',
  DELETE_LEAD = 'delete:lead',
  
  // Opportunity permissions
  CREATE_OPPORTUNITY = 'create:opportunity',
  READ_OPPORTUNITY = 'read:opportunity',
  UPDATE_OPPORTUNITY = 'update:opportunity',
  DELETE_OPPORTUNITY = 'delete:opportunity',
  
  // Project permissions
  CREATE_PROJECT = 'create:project',
  READ_PROJECT = 'read:project',
  UPDATE_PROJECT = 'update:project',
  DELETE_PROJECT = 'delete:project',
  
  // User permissions
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  
  // Admin permissions
  MANAGE_ROLES = 'manage:roles',
  MANAGE_PERMISSIONS = 'manage:permissions',
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_SETTINGS = 'manage:settings'
}

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission), // All permissions
  [UserRole.MANAGER]: [
    Permission.CREATE_COMPANY,
    Permission.READ_COMPANY,
    Permission.UPDATE_COMPANY,
    Permission.CREATE_LEAD,
    Permission.READ_LEAD,
    Permission.UPDATE_LEAD,
    Permission.CREATE_OPPORTUNITY,
    Permission.READ_OPPORTUNITY,
    Permission.UPDATE_OPPORTUNITY,
    Permission.CREATE_PROJECT,
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.READ_USER,
    Permission.VIEW_ANALYTICS
  ],
  [UserRole.USER]: [
    Permission.READ_COMPANY,
    Permission.CREATE_LEAD,
    Permission.READ_LEAD,
    Permission.UPDATE_LEAD,
    Permission.READ_OPPORTUNITY,
    Permission.READ_PROJECT,
    Permission.READ_USER
  ]
};