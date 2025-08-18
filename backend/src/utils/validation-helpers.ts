import { AppError } from './errors';

/**
 * Validate and parse UUID string
 */
export function validateUUID(value: any): string | undefined {
  if (!value) return undefined;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const strValue = String(value);
  
  if (!uuidRegex.test(strValue)) {
    throw new AppError(`Invalid UUID format: ${value}`, 400);
  }
  
  return strValue;
}

/**
 * Validate and parse number with bounds checking
 */
export function validateNumber(
  value: any, 
  options: { min?: number; max?: number; precision?: number } = {}
): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    throw new AppError(`Invalid number: ${value}`, 400);
  }
  
  if (options.min !== undefined && numValue < options.min) {
    throw new AppError(`Value must be at least ${options.min}`, 400);
  }
  
  if (options.max !== undefined && numValue > options.max) {
    throw new AppError(`Value must be at most ${options.max}`, 400);
  }
  
  if (options.precision !== undefined) {
    return Math.round(numValue * Math.pow(10, options.precision)) / Math.pow(10, options.precision);
  }
  
  return numValue;
}

/**
 * Validate and parse date string
 */
export function validateDate(value: any): Date | undefined {
  if (!value) return undefined;
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    throw new AppError(`Invalid date: ${value}`, 400);
  }
  
  return date;
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: any, 
  endDate: any
): { start?: Date; end?: Date } {
  const start = validateDate(startDate);
  const end = validateDate(endDate);
  
  if (start && end && start > end) {
    throw new AppError('Start date must be before end date', 400);
  }
  
  return { start, end };
}

/**
 * Safe money calculation using integers (cents)
 */
export class MoneyCalculator {
  private static toCents(amount: number): number {
    return Math.round(amount * 100);
  }
  
  private static fromCents(cents: number): number {
    return cents / 100;
  }
  
  static add(a: number, b: number): number {
    return this.fromCents(this.toCents(a) + this.toCents(b));
  }
  
  static subtract(a: number, b: number): number {
    return this.fromCents(this.toCents(a) - this.toCents(b));
  }
  
  static multiply(amount: number, factor: number): number {
    return this.fromCents(Math.round(this.toCents(amount) * factor));
  }
  
  static percentage(amount: number, percent: number): number {
    return this.fromCents(Math.round(this.toCents(amount) * percent / 100));
  }
  
  static calculateDiscount(amount: number, discountPercent: number): number {
    const discount = this.percentage(amount, discountPercent);
    return this.subtract(amount, discount);
  }
  
  static calculateTax(amount: number, taxPercent: number): number {
    return this.percentage(amount, taxPercent);
  }
  
  static calculateTotal(
    subtotal: number, 
    discountPercent: number = 0, 
    taxPercent: number = 0
  ): {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  } {
    const discount = this.percentage(subtotal, discountPercent);
    const afterDiscount = this.subtract(subtotal, discount);
    const tax = this.percentage(afterDiscount, taxPercent);
    const total = this.add(afterDiscount, tax);
    
    return {
      subtotal,
      discount,
      tax,
      total,
    };
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(value: any, maxLength?: number): string | undefined {
  if (!value) return undefined;
  
  let str = String(value).trim();
  
  // Remove control characters except newlines and tabs
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  if (maxLength && str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  
  return str;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends Record<string, any>>(
  value: any,
  enumObj: T
): T[keyof T] | undefined {
  if (!value) return undefined;
  
  const enumValues = Object.values(enumObj);
  if (!enumValues.includes(value)) {
    throw new AppError(`Invalid value: ${value}. Must be one of: ${enumValues.join(', ')}`, 400);
  }
  
  return value as T[keyof T];
}

/**
 * Batch validate multiple fields
 */
export function validateFields(data: Record<string, any>, validators: Record<string, Function>): Record<string, any> {
  const validated: Record<string, any> = {};
  const errors: string[] = [];
  
  for (const [field, validator] of Object.entries(validators)) {
    try {
      validated[field] = validator(data[field]);
    } catch (error) {
      if (error instanceof AppError) {
        errors.push(`${field}: ${error.message}`);
      } else {
        errors.push(`${field}: Validation failed`);
      }
    }
  }
  
  if (errors.length > 0) {
    throw new AppError(`Validation errors: ${errors.join('; ')}`, 400);
  }
  
  return validated;
}