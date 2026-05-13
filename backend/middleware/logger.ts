import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Secure Logger
 * Logs API requests without capturing sensitive PII or credentials.
 * Includes user context for auditing.
 */
export const secureLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            user_id: req.user?.id || 'anonymous',
            ip: req.ip,
            user_agent: req.headers['user-agent'],
            // NEVER log req.body or req.headers.authorization here
        };

        console.log(JSON.stringify(logEntry));
    });

    next();
};
