import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Rate Limiter Middleware (Simplified for Demo)
 * In production, use 'express-rate-limit' with a Redis store.
 */
const requestCounts = new Map<string, { count: number, resetAt: number }>();

export const rateLimiter = (limit: number, windowMs: number) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const key = req.ip || 'anonymous';
        const now = Date.now();
        const record = requestCounts.get(key) || { count: 0, resetAt: now + windowMs };

        if (now > record.resetAt) {
            record.count = 1;
            record.resetAt = now + windowMs;
        } else {
            record.count++;
        }

        requestCounts.set(key, record);

        if (record.count > limit) {
            return res.status(429).json({ error: 'Too many requests' });
        }

        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));

        next();
    };
};
