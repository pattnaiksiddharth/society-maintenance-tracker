import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/stats ──────────────────────────────────────────────────────────

router.get('/', requireAuth, async (_req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      total,
      open,
      inProgress,
      resolved,
      overdue,
      totalResidents,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'OPEN' }),
      Complaint.countDocuments({ status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ status: 'RESOLVED' }),
      Complaint.countDocuments({
        status: { $ne: 'RESOLVED' },
        createdAt: { $lt: sevenDaysAgo },
      }),
      User.countDocuments({ role: 'resident' }),
    ]);

    res.json({
      total,
      open,
      inProgress,
      resolved,
      overdue,
      totalResidents,
    });
  } catch (err) {
    console.error('[Stats] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

export default router;
