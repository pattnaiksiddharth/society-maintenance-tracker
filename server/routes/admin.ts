import { Router } from 'express';
import Complaint from '../models/Complaint.js';
import ComplaintHistory from '../models/ComplaintHistory.js';
import Notice from '../models/Notice.js';
import EmailLog from '../models/EmailLog.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// ─── POST /api/admin/reset-demo ──────────────────────────────────────────────

router.post('/reset-demo', async (_req, res) => {
  try {
    // Wipe all transactional data — users/settings are preserved
    await Promise.all([
      Complaint.deleteMany({}),
      ComplaintHistory.deleteMany({}),
      Notice.deleteMany({}),
      EmailLog.deleteMany({}),
    ]);

    res.json({ message: 'Demo data reset successfully.' });
  } catch (err) {
    console.error('[Admin] reset-demo error:', err);
    res.status(500).json({ error: 'Failed to reset demo data.' });
  }
});

export default router;
