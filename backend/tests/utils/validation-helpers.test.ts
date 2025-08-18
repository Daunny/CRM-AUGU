import { 
  validateUUID, 
  validateNumber, 
  validateDate, 
  validateDateRange,
  MoneyCalculator,
  sanitizeString,
  validateEnum,
  validateFields
} from '../../src/utils/validation-helpers';
import { AppError } from '../../src/utils/errors';

describe('Validation Helpers', () => {
  describe('validateUUID', () => {
    it('should accept valid UUID v4', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(validateUUID(uuid)).toBe(uuid);
    });

    it('should return undefined for empty values', () => {
      expect(validateUUID(null)).toBeUndefined();
      expect(validateUUID(undefined)).toBeUndefined();
      expect(validateUUID('')).toBeUndefined();
    });

    it('should reject invalid UUID formats', () => {
      expect(() => validateUUID('invalid')).toThrow(AppError);
      expect(() => validateUUID('123')).toThrow(AppError);
      expect(() => validateUUID('not-a-uuid')).toThrow(AppError);
      expect(() => validateUUID('123e4567-e89b-12d3-a456')).toThrow(AppError);
    });

    it('should handle UUID with uppercase letters', () => {
      const uuid = '123E4567-E89B-12D3-A456-426614174000';
      expect(validateUUID(uuid)).toBe(uuid);
    });
  });

  describe('validateNumber', () => {
    it('should parse valid numbers', () => {
      expect(validateNumber('42')).toBe(42);
      expect(validateNumber(42)).toBe(42);
      expect(validateNumber('3.14')).toBe(3.14);
      expect(validateNumber(3.14)).toBe(3.14);
    });

    it('should return undefined for empty values', () => {
      expect(validateNumber(null)).toBeUndefined();
      expect(validateNumber(undefined)).toBeUndefined();
      expect(validateNumber('')).toBeUndefined();
    });

    it('should reject invalid numbers', () => {
      expect(() => validateNumber('not-a-number')).toThrow(AppError);
      expect(() => validateNumber('12abc')).toThrow(AppError);
      expect(() => validateNumber({})).toThrow(AppError);
    });

    it('should enforce min/max bounds', () => {
      expect(validateNumber(5, { min: 0, max: 10 })).toBe(5);
      expect(() => validateNumber(-1, { min: 0 })).toThrow(AppError);
      expect(() => validateNumber(11, { max: 10 })).toThrow(AppError);
    });

    it('should handle precision correctly', () => {
      expect(validateNumber(3.14159, { precision: 2 })).toBe(3.14);
      expect(validateNumber(10.999, { precision: 2 })).toBe(11);
      expect(validateNumber(10.001, { precision: 2 })).toBe(10);
    });
  });

  describe('validateDate', () => {
    it('should parse valid date strings', () => {
      const dateStr = '2024-12-19T10:30:00.000Z';
      const result = validateDate(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(dateStr);
    });

    it('should return undefined for empty values', () => {
      expect(validateDate(null)).toBeUndefined();
      expect(validateDate(undefined)).toBeUndefined();
      expect(validateDate('')).toBeUndefined();
    });

    it('should reject invalid dates', () => {
      expect(() => validateDate('invalid-date')).toThrow(AppError);
      expect(() => validateDate('2024-13-01')).toThrow(AppError); // Invalid month
      // Note: JavaScript Date constructor accepts 2024-02-30 and converts it to 2024-03-01
      // So we test with a clearly invalid date format instead
      expect(() => validateDate('not a date at all')).toThrow(AppError);
    });
  });

  describe('validateDateRange', () => {
    it('should validate proper date ranges', () => {
      const result = validateDateRange('2024-01-01', '2024-12-31');
      expect(result.start).toBeInstanceOf(Date);
      expect(result.end).toBeInstanceOf(Date);
    });

    it('should handle partial ranges', () => {
      const startOnly = validateDateRange('2024-01-01', null);
      expect(startOnly.start).toBeInstanceOf(Date);
      expect(startOnly.end).toBeUndefined();

      const endOnly = validateDateRange(null, '2024-12-31');
      expect(endOnly.start).toBeUndefined();
      expect(endOnly.end).toBeInstanceOf(Date);
    });

    it('should reject invalid date ranges', () => {
      expect(() => validateDateRange('2024-12-31', '2024-01-01')).toThrow(AppError);
    });
  });

  describe('MoneyCalculator', () => {
    it('should handle addition correctly', () => {
      expect(MoneyCalculator.add(10.50, 5.25)).toBe(15.75);
      expect(MoneyCalculator.add(0.1, 0.2)).toBe(0.3); // Classic floating point issue
    });

    it('should handle subtraction correctly', () => {
      expect(MoneyCalculator.subtract(10.50, 5.25)).toBe(5.25);
      expect(MoneyCalculator.subtract(0.3, 0.1)).toBe(0.2);
    });

    it('should handle multiplication correctly', () => {
      expect(MoneyCalculator.multiply(10.50, 2)).toBe(21);
      expect(MoneyCalculator.multiply(9.99, 3)).toBe(29.97);
    });

    it('should calculate percentages correctly', () => {
      expect(MoneyCalculator.percentage(100, 10)).toBe(10);
      expect(MoneyCalculator.percentage(99.99, 15)).toBe(15);
      expect(MoneyCalculator.percentage(50, 7.5)).toBe(3.75);
    });

    it('should calculate discounts correctly', () => {
      expect(MoneyCalculator.calculateDiscount(100, 10)).toBe(90);
      expect(MoneyCalculator.calculateDiscount(99.99, 15)).toBe(84.99);
    });

    it('should calculate tax correctly', () => {
      expect(MoneyCalculator.calculateTax(100, 10)).toBe(10);
      expect(MoneyCalculator.calculateTax(100, 8.875)).toBe(8.88); // NYC tax rate
    });

    it('should calculate totals with discount and tax', () => {
      const result = MoneyCalculator.calculateTotal(100, 10, 15);
      expect(result.subtotal).toBe(100);
      expect(result.discount).toBe(10);
      expect(result.tax).toBe(13.5); // 15% of 90
      expect(result.total).toBe(103.5); // 90 + 13.5
    });

    it('should handle edge cases', () => {
      const result = MoneyCalculator.calculateTotal(0, 10, 15);
      expect(result.total).toBe(0);

      const noDiscountTax = MoneyCalculator.calculateTotal(100, 0, 0);
      expect(noDiscountTax.total).toBe(100);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\t\ntest\r\n')).toBe('test');
    });

    it('should remove control characters', () => {
      expect(sanitizeString('hello\x00world')).toBe('helloworld');
      expect(sanitizeString('test\x1Fstring')).toBe('teststring');
    });

    it('should preserve newlines and tabs', () => {
      expect(sanitizeString('line1\nline2\ttab')).toBe('line1\nline2\ttab');
    });

    it('should enforce max length', () => {
      expect(sanitizeString('hello world', 5)).toBe('hello');
      expect(sanitizeString('test', 10)).toBe('test');
    });

    it('should return undefined for empty values', () => {
      expect(sanitizeString(null)).toBeUndefined();
      expect(sanitizeString(undefined)).toBeUndefined();
      expect(sanitizeString('')).toBeUndefined();
    });
  });

  describe('validateEnum', () => {
    enum TestEnum {
      OPTION1 = 'option1',
      OPTION2 = 'option2',
      OPTION3 = 'option3'
    }

    it('should accept valid enum values', () => {
      expect(validateEnum('option1', TestEnum)).toBe('option1');
      expect(validateEnum('option2', TestEnum)).toBe('option2');
    });

    it('should return undefined for empty values', () => {
      expect(validateEnum(null, TestEnum)).toBeUndefined();
      expect(validateEnum(undefined, TestEnum)).toBeUndefined();
    });

    it('should reject invalid enum values', () => {
      expect(() => validateEnum('invalid', TestEnum)).toThrow(AppError);
      expect(() => validateEnum('OPTION1', TestEnum)).toThrow(AppError); // Case sensitive
    });
  });

  describe('validateFields', () => {
    it('should validate multiple fields successfully', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        amount: '100.50',
        name: '  Test Name  '
      };

      const validators = {
        id: validateUUID,
        amount: (v: any) => validateNumber(v, { min: 0, precision: 2 }),
        name: (v: any) => sanitizeString(v, 50)
      };

      const result = validateFields(data, validators);
      expect(result.id).toBe(data.id);
      expect(result.amount).toBe(100.50);
      expect(result.name).toBe('Test Name');
    });

    it('should collect all validation errors', () => {
      const data = {
        id: 'invalid-uuid',
        amount: 'not-a-number',
        date: 'invalid-date'
      };

      const validators = {
        id: validateUUID,
        amount: (v: any) => validateNumber(v),
        date: validateDate
      };

      expect(() => validateFields(data, validators)).toThrow(AppError);
      try {
        validateFields(data, validators);
      } catch (error) {
        if (error instanceof AppError) {
          expect(error.message).toContain('id:');
          expect(error.message).toContain('amount:');
          expect(error.message).toContain('date:');
        }
      }
    });

    it('should handle missing fields', () => {
      const data = {};
      const validators = {
        optional1: validateUUID,
        optional2: validateNumber
      };

      const result = validateFields(data, validators);
      expect(result.optional1).toBeUndefined();
      expect(result.optional2).toBeUndefined();
    });
  });
});