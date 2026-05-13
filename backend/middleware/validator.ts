import { Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AuthenticatedRequest } from './auth';

/**
 * Validation Middleware
 * Uses Zod to enforce strict schema validation on request body, query, and params.
 * Prevents Mass Assignment and ensures input normalization.
 */
export const validate = (schema: AnyZodObject) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            // Replace request parts with validated and normalized data
            req.body = result.body;
            req.query = result.query;
            req.params = result.params;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(e => ({ path: e.path, message: e.message }))
                });
            }
            return res.status(500).json({ error: 'Internal validation error' });
        }
    };
};
