import { Router } from 'express';
import EmailLog from '../models/EmailLog.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/emails ─────────────────────────────────────────────────────────

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const logs = await EmailLog.find().sort({ sentAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error('[Emails] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch email logs.' });
  }
});

export default router;
