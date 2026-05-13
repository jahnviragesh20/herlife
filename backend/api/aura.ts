import express from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { checkOwnership } from '../middleware/ownership';
import { validate } from '../middleware/validator';
import { rateLimiter } from '../middleware/rateLimiter';
import { db } from '../db';

const router = express.Router();

// 1. Define Strict Schemas (Mass Assignment Protection)
const CreateChatSchema = z.object({
    body: z.object({
        encrypted_payload: z.string().min(10),
        iv: z.string().length(24), // Base64 12-byte IV
    }),
});

const GetChatSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

/**
 * GET /v1/aura/:id
 * Protection: Auth + Ownership + Schema Validation + Rate Limiting
 */
router.get('/:id',
    rateLimiter(100, 15 * 60 * 1000), // 100 reqs / 15 mins
    authenticate,
    validate(GetChatSchema),
    checkOwnership('encrypted_aura_chats'),
    async (req, res) => {
        try {
            // Defense-in-depth: Even with checkOwnership, we scope the query
            const chat = await db('encrypted_aura_chats')
                .where({
                    id: req.params.id,
                    user_id: (req as any).user.id
                })
                .first();

            if (!chat) {
                // Generic 404 to prevent resource enumeration
                return res.status(404).json({ error: 'Resource not found' });
            }

            res.json(chat);
        } catch (error) {
            // Handled by global errorHandler
            throw error;
        }
    }
);

/**
 * POST /v1/aura
 * Protection: Auth + Schema Validation (Strict) + Forced Ownership
 */
router.post('/',
    rateLimiter(50, 15 * 60 * 1000), // 50 reqs / 15 mins
    authenticate,
    validate(CreateChatSchema),
    async (req, res) => {
        const { encrypted_payload, iv } = req.body;
        const userId = (req as any).user.id;

        try {
            // Forced Ownership: user_id is taken from JWT, NEVER from body
            const [newChat] = await db('encrypted_aura_chats').insert({
                user_id: userId,
                encrypted_payload,
                iv,
            }).returning('*');

            res.status(201).json(newChat);
        } catch (error) {
            throw error;
        }
    }
);

export default router;
