import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { db } from '../db'; // Mock DB instance

/**
 * Ownership Middleware
 * Ensures that the resource being accessed belongs to the authenticated user.
 * This is the application-level check that complements DB-level RLS.
 */
export const checkOwnership = (resourceTable: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const resourceId = req.params.id;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const resource = await db(resourceTable).where({ id: resourceId }).first();

            if (!resource) {
                return res.status(404).json({ error: 'Resource not found' });
            }

            if (resource.user_id !== userId) {
                // Return 404 instead of 403 to prevent resource enumeration
                return res.status(404).json({ error: 'Resource not found' });
            }

            next();
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
};
