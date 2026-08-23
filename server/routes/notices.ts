import { Router } from 'express';
import mongoose from 'mongoose';
import Notice from '../models/Notice.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// ─── GET /api/notices ────────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  try {
    const notices = await Notice.find().sort({ important: -1, createdAt: -1 });
    res.json(notices);
  } catch (err) {
    console.error('[Notices] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch notices.' });
  }
});

// ─── POST /api/notices ───────────────────────────────────────────────────────

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, content, category, important, authorId, authorName, authorRole } = req.body;

    if (!title || !content || !authorId) {
      res.status(400).json({ error: 'title, content, and authorId are required.' });
      return;
    }

    const notice = await Notice.create({
      title,
      content,
      category: category || 'GENERAL',
      important: !!important,
      authorId: new mongoose.Types.ObjectId(authorId),
      authorName,
      authorRole: authorRole || 'admin',
    });

    res.status(201).json(notice);
  } catch (err) {
    console.error('[Notices] POST / error:', err);
    res.status(500).json({ error: 'Failed to create notice.' });
  }
});

// ─── DELETE /api/notices/:id ─────────────────────────────────────────────────

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      res.status(404).json({ error: 'Notice not found.' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('[Notices] DELETE /:id error:', err);
    res.status(500).json({ error: 'Failed to delete notice.' });
  }
});

export default router;
