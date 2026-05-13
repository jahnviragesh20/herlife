import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './authService'; // Mock auth service

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

/**
 * Auth Middleware
 * Verifies the JWT from the Authorization header.
 * Rejects if token is missing, invalid, or expired.
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = await verifyToken(token);
        req.user = {
            id: decoded.sub,
            email: decoded.email,
        };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
