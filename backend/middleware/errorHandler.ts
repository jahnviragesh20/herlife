import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Secure Error Handler
 * Prevents information disclosure by mapping internal errors to generic messages.
 * Never leaks stack traces in production.
 */
export const errorHandler = (err: any, req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log the actual error for developers (internally)
    console.error(`[Error] ${req.method} ${req.url}:`, err);

    const status = err.status || 500;
    const message = isProduction ? 'An unexpected error occurred' : err.message;

    res.status(status).json({
        error: message,
        ...(isProduction ? {} : { stack: err.stack })
    });
};
