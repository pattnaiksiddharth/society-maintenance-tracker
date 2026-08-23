import { Router } from 'express';
import { getSettings } from '../models/Settings.js';
import Settings from '../models/Settings.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// ─── GET /api/settings ───────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error('[Settings] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// ─── PUT /api/settings ───────────────────────────────────────────────────────

router.put('/', requireAdmin, async (req, res) => {
  try {
    const existing = await getSettings();

    const updated = await Settings.findByIdAndUpdate(
      existing._id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('[Settings] PUT / error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

export default router;
