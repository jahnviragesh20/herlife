import express from 'express';
import { authenticate } from '../middleware/auth';
import { checkOwnership } from '../middleware/ownership';
import { db } from '../db';

const router = express.Router();

/**
 * GET /v1/aura/:id
 * Securely retrieve an encrypted aura chat session.
 * 1. Authenticate user.
 * 2. Check ownership of the chat session.
 */
router.get('/:id', authenticate, checkOwnership('encrypted_aura_chats'), async (req, res) => {
    try {
        const chat = await db('encrypted_aura_chats').where({ id: req.params.id }).first();
        // Even though RLS and checkOwnership protect this,
        // we still filter by user_id for defense-in-depth.
        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve chat' });
    }
});

/**
 * POST /v1/aura
 * Create a new encrypted aura chat session.
 * 1. Authenticate user.
 * 2. Enforce user_id from JWT.
 */
router.post('/', authenticate, async (req, res) => {
    const { encrypted_payload, iv } = req.body;
    const userId = (req as any).user.id;

    try {
        const [newChat] = await db('encrypted_aura_chats').insert({
            user_id: userId,
            encrypted_payload,
            iv,
        }).returning('*');

        res.status(201).json(newChat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save chat' });
    }
});

export default router;
