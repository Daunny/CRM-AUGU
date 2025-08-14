import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { BadRequestError } from '../utils/errors';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema | Joi.ObjectSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Check if it's a simple Joi schema or a ValidationSchema
      const isValidationSchema = 'body' in schema || 'params' in schema || 'query' in schema;
      
      if (isValidationSchema) {
        const validationSchema = schema as ValidationSchema;
        
        // Validate body
        if (validationSchema.body) {
          const { error, value } = validationSchema.body.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
          });
          if (error) {
            const errors = error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            }));
            throw new BadRequestError('Validation failed', errors);
          }
          req.body = value;
        }

        // Validate params
        if (validationSchema.params) {
          const { error, value } = validationSchema.params.validate(req.params, {
            abortEarly: false,
          });
          if (error) {
            const errors = error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            }));
            throw new BadRequestError('Validation failed', errors);
          }
          req.params = value;
        }

        // Validate query
        if (validationSchema.query) {
          const { error, value } = validationSchema.query.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
          });
          if (error) {
            const errors = error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            }));
            throw new BadRequestError('Validation failed', errors);
          }
          req.query = value;
        }
      } else {
        // Simple body schema
        const bodySchema = schema as Joi.ObjectSchema;
        const { error, value } = bodySchema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          }));
          throw new BadRequestError('Validation failed', errors);
        }
        req.body = value;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};