import { Router } from 'express';
import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import ComplaintHistory from '../models/ComplaintHistory.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All complaint routes require authentication
router.use(requireAuth);

// ─── GET /api/complaints ─────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { status, category, priority, overdueOnly, residentId, search } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = {};

    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (residentId) filter.residentId = new mongoose.Types.ObjectId(residentId);

    // Residents can only see their own complaints
    if (req.user!.role === 'resident') {
      filter.residentId = new mongoose.Types.ObjectId(req.user!.userId);
    }

    if (overdueOnly === 'true') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filter.status = { $ne: 'RESOLVED' };
      filter.createdAt = { $lt: sevenDaysAgo };
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { description: regex }, { code: regex }];
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error('[Complaints] GET / error:', err);
    res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
});

// ─── POST /api/complaints ────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const {
      residentId,
      residentName,
      residentUnit,
      residentContact,
      category,
      title,
      description,
      photoUrl,
      priority,
    } = req.body;

    if (!residentId || !category || !title || !description) {
      res.status(400).json({ error: 'residentId, category, title, and description are required.' });
      return;
    }

    // Generate unique complaint code: C-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const count = await Complaint.countDocuments();
    const code = `C-${year}-${String(count + 1).padStart(6, '0')}`;

    const complaint = await Complaint.create({
      code,
      residentId: new mongoose.Types.ObjectId(residentId),
      residentName,
      residentUnit,
      residentContact: residentContact || '+91 98000 00000',
      category,
      title,
      description,
      photoUrl,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error('[Complaints] POST / error:', err);
    res.status(500).json({ error: 'Failed to create complaint.' });
  }
});

// ─── GET /api/complaints/:id ─────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    // Residents can only view their own complaints
    if (
      req.user!.role === 'resident' &&
      complaint.residentId.toString() !== req.user!.userId
    ) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    res.json(complaint);
  } catch (err) {
    console.error('[Complaints] GET /:id error:', err);
    res.status(500).json({ error: 'Failed to fetch complaint.' });
  }
});

// ─── PATCH /api/complaints/:id/status ───────────────────────────────────────

router.patch('/:id/status', async (req, res) => {
  try {
    const { newStatus, actorId, actorName, actorRole, note, assignedTo, priority } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    const previousStatus = complaint.status;

    // Record history entry
    await ComplaintHistory.create({
      complaintId: complaint._id,
      previousStatus,
      newStatus,
      actorId: new mongoose.Types.ObjectId(actorId),
      actorName,
      actorRole,
      note,
    });

    // Update complaint
    complaint.status = newStatus;
    if (assignedTo !== undefined) complaint.assignedTo = assignedTo;
    if (priority !== undefined) complaint.priority = priority;
    if (newStatus === 'RESOLVED') complaint.resolvedAt = new Date();

    await complaint.save();

    res.json(complaint);
  } catch (err) {
    console.error('[Complaints] PATCH /:id/status error:', err);
    res.status(500).json({ error: 'Failed to update complaint status.' });
  }
});

// ─── PATCH /api/complaints/:id/priority ─────────────────────────────────────

router.patch('/:id/priority', async (req, res) => {
  try {
    const { priority } = req.body;
    if (!priority) {
      res.status(400).json({ error: 'priority is required.' });
      return;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true }
    );

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    res.json(complaint);
  } catch (err) {
    console.error('[Complaints] PATCH /:id/priority error:', err);
    res.status(500).json({ error: 'Failed to update priority.' });
  }
});

export default router;
