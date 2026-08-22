import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './server/db';
import User from './server/models/User';
import Complaint from './server/models/Complaint';
import ComplaintHistory from './server/models/ComplaintHistory';
import Notice from './server/models/Notice';
import Settings, { getSettings } from './server/models/Settings';
import EmailLog from './server/models/EmailLog';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
import {
  generateToken,
  setCookieToken,
  clearCookieToken,
  requireAuth,
  requireAdmin,
} from './server/middleware/auth';
import type {
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
} from './src/types';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isDev = process.env.NODE_ENV !== 'production';

// ── Validate required environment variables at startup ────────────────────────
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

// ── Security headers (Helmet) ─────────────────────────────────────────────────
// Disable CSP in dev to allow Vite HMR (inline scripts, websockets, etc.)
app.use(helmet({ contentSecurityPolicy: isDev ? false : undefined }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,                              // allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Cookie parser (required for JWT httpOnly cookie) ─────────────────────────
app.use(cookieParser());

// ── Body parsing — global limit is 2 MB; complaint photo route overrides this ─
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// ──────────────────────────────────────────────────────────────────────────────
// Helper: serialise a user document without sensitive fields
// ──────────────────────────────────────────────────────────────────────────────
function serializeUser(u: any) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    unitNumber: u.unitNumber,
    contactNumber: u.contactNumber,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: enrich a complaint document with computed overdue/age fields
// and attach its history records — matching the original API response shape.
// ──────────────────────────────────────────────────────────────────────────────
async function enrichComplaint(complaint: any, thresholdDays: number): Promise<any> {
  const createdTime = new Date(complaint.createdAt).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
  const isOverdue = complaint.status !== 'RESOLVED' && diffDays >= thresholdDays;

  const historyDocs = await ComplaintHistory.find({
    complaintId: complaint._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  const history = historyDocs.map((h: any) => ({
    id: h._id.toString(),
    complaintId: h.complaintId.toString(),
    previousStatus: h.previousStatus,
    newStatus: h.newStatus,
    actorId: h.actorId.toString(),
    actorName: h.actorName,
    actorRole: h.actorRole,
    note: h.note,
    timestamp: h.createdAt,
  }));

  const plain = complaint.toJSON ? complaint.toJSON() : { ...complaint };
  return {
    ...plain,
    ageDays: diffDays,
    isOverdue,
    history,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: dispatch email (DB audit log + optional SMTP)
// ──────────────────────────────────────────────────────────────────────────────
async function sendSimulatedEmail(
  to: string,
  recipientName: string,
  subject: string,
  body: string,
  type: string,
  referenceId?: string
) {
  try {
    const log = await EmailLog.create({
      to,
      recipientName,
      subject,
      body,
      type: type as any,
      referenceId,
      sentAt: new Date(),
    });

    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });

      transporter.sendMail(
        {
          from: process.env.SMTP_FROM || '"Silver Oaks Helpdesk" <noreply@society.org>',
          to,
          subject,
          text: body,
        },
        (error, info) => {
          if (error) console.error('[Email] Real dispatch failed:', error);
          else console.log('[Email] Real dispatch OK. Message ID:', info.messageId);
        }
      );
    } else {
      console.log(`[Email] Simulated dispatch to ${to} (subject: "${subject}") logged in DB.`);
    }

    return log;
  } catch (err) {
    console.error('[Email] Failed to log/dispatch email:', err);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. Health (public — no sensitive data exposed) ────────────────────────────
app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── 2. Auth ───────────────────────────────────────────────────────────────────

// Current authenticated user — called by the frontend on page load to restore session
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId).lean();
    if (!user) {
      clearCookieToken(res);
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    res.json(serializeUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current user.' });
  }
});

// List all users — admin only (used by dev persona switcher)
app.get('/api/auth/users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: 1 }).lean();
    res.json(users.map(serializeUser));
  } catch {
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();

    // Always compare hashes — prevents user enumeration timing attacks
    const DUMMY_HASH = '$2b$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu';
    const hashToCompare = user ? (user as any).passwordHash : DUMMY_HASH;
    const isValid = await bcrypt.compare(String(password), hashToCompare);

    if (!user || !isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      userId: (user as any)._id.toString(),
      role: user.role as 'resident' | 'admin',
      email: user.email,
      name: user.name,
    });

    setCookieToken(res, token);
    res.json(serializeUser(user));
  } catch (err) {
    console.error('[Login]', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Logout
app.post('/api/auth/logout', (_req, res) => {
  clearCookieToken(res);
  res.json({ message: 'Logged out successfully.' });
});

// Register — public registration always creates a 'resident' account
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, unitNumber, contactNumber, password } = req.body;

    // Basic input validation
    if (!name || !email || !unitNumber || !password) {
      return res.status(400).json({ error: 'Name, email, unit number, and password are required.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    // Role is ALWAYS 'resident' for public registration — never trust client-supplied role
    const newUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      unitNumber: String(unitNumber).trim(),
      contactNumber: contactNumber ? String(contactNumber).trim() : '+91 90000 00000',
      role: 'resident',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(String(name))}`,
      passwordHash,
    });

    const token = generateToken({
      userId: (newUser._id as any).toString(),
      role: 'resident',
      email: newUser.email,
      name: newUser.name,
    });

    setCookieToken(res, token);
    res.status(201).json(serializeUser(newUser));
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    console.error('[Register]', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// ── 3. Stats (admin only) ─────────────────────────────────────────────────────
app.get('/api/stats', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const settings = await getSettings();
    const threshold = settings.overdueThresholdDays;
    const thresholdDate = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);

    const [totalOpen, inProgress, resolved, totalComplaints, overdue] = await Promise.all([
      Complaint.countDocuments({ status: 'OPEN' }),
      Complaint.countDocuments({ status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ status: 'RESOLVED' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $ne: 'RESOLVED' }, createdAt: { $lte: thresholdDate } }),
    ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const openToday = await Complaint.countDocuments({ createdAt: { $gte: startOfDay } });

    const resolutionRatePercent =
      totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;

    const categoryAgg = await Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    const categoryDistribution = categoryAgg.map((a) => ({
      category: a._id as ComplaintCategory,
      count: a.count,
    }));

    const statusDistribution = [
      { status: 'OPEN' as ComplaintStatus, count: totalOpen },
      { status: 'IN_PROGRESS' as ComplaintStatus, count: inProgress },
      { status: 'RESOLVED' as ComplaintStatus, count: resolved },
    ];

    const priorityAgg = await Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);
    const priorityDistribution = ['HIGH', 'MEDIUM', 'LOW'].map((p) => ({
      priority: p as ComplaintPriority,
      count: priorityAgg.find((a) => a._id === p)?.count ?? 0,
    }));

    res.json({
      totalOpen,
      inProgress,
      resolved,
      overdue,
      totalComplaints,
      resolutionRatePercent,
      openToday: openToday || 0,
      categoryDistribution,
      statusDistribution,
      priorityDistribution,
    });
  } catch (err) {
    console.error('[Stats]', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── 4. Complaints ─────────────────────────────────────────────────────────────

// GET all complaints — admin sees all; resident sees only their own
app.get('/api/complaints', requireAuth, async (req, res) => {
  try {
    const { status, category, priority, overdueOnly, search } =
      req.query as Record<string, string>;

    const settings = await getSettings();
    const threshold = settings.overdueThresholdDays;
    const thresholdDate = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);

    const filter: Record<string, any> = {};

    // ── Resident data isolation ────────────────────────────────────────────────
    // Residents may ONLY see their own complaints — identity comes from JWT, never client input.
    if (req.user!.role === 'resident') {
      const residentDoc = await User.findById(req.user!.userId).lean();
      if (!residentDoc) {
        return res.status(401).json({ error: 'User not found.' });
      }
      filter.residentId = residentDoc._id;
    }
    // Admins see all complaints; optional filters below apply to both roles

    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;
    if (priority && priority !== 'ALL') filter.priority = priority;

    if (overdueOnly === 'true') {
      filter.status = { $ne: 'RESOLVED' };
      filter.createdAt = { $lte: thresholdDate };
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { residentName: { $regex: q, $options: 'i' } },
        { residentUnit: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(
      complaints.map((c: any) =>
        enrichComplaint(
          { ...c, toJSON: () => ({ ...c, id: c._id.toString(), residentId: c.residentId?.toString() }) },
          threshold
        )
      )
    );

    res.json(enriched);
  } catch (err) {
    console.error('[Complaints GET]', err);
    res.status(500).json({ error: 'Failed to fetch complaints.' });
  }
});

// GET single complaint — admin: any; resident: only their own
app.get('/api/complaints/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid complaint ID.' });
    }
    const settings = await getSettings();

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Resident isolation: can only view own complaint
    if (req.user!.role === 'resident') {
      const residentDoc = await User.findById(req.user!.userId).lean();
      if (!residentDoc || complaint.residentId?.toString() !== (residentDoc as any)._id.toString()) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    res.json(await enrichComplaint(complaint, settings.overdueThresholdDays));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch complaint.' });
  }
});

// POST create complaint — authenticated residents (and admins) only
// Uses 10 MB body limit specifically for this route to accommodate photo uploads
app.post(
  '/api/complaints',
  requireAuth,
  express.json({ limit: '10mb' }),
  async (req, res) => {
    try {
      const {
        residentName,
        residentUnit,
        residentContact,
        category,
        title,
        description,
        photoUrl,
        priority,
      } = req.body;

      if (!title || !description || !category || !residentName || !residentUnit) {
        return res.status(400).json({ error: 'Required complaint fields missing.' });
      }

      // Validate photo payload if provided
      if (photoUrl) {
        const validPrefixes = [
          'data:image/jpeg;base64,',
          'data:image/jpg;base64,',
          'data:image/png;base64,',
          'data:image/webp;base64,',
          'data:image/gif;base64,',
        ];
        const hasValidPrefix = validPrefixes.some((p) => String(photoUrl).startsWith(p));
        if (!hasValidPrefix && !String(photoUrl).startsWith('http')) {
          return res.status(400).json({ error: 'Invalid image format. Only JPEG, PNG, or WebP are allowed.' });
        }
        // Reject base64 strings over ~5 MB (5 * 1024 * 1024 * 4/3 ≈ 6.8M chars)
        if (String(photoUrl).startsWith('data:') && String(photoUrl).length > 7_000_000) {
          return res.status(400).json({ error: 'Image is too large. Maximum 5 MB.' });
        }
      }

      // Actor identity comes from the JWT — never from client payload
      const actorUser = await User.findById(req.user!.userId).lean();
      if (!actorUser) {
        return res.status(401).json({ error: 'User not found.' });
      }

      let finalResidentId = (actorUser as any)._id;
      let finalResidentName = actorUser.name;
      let finalResidentUnit = actorUser.unitNumber;
      let finalResidentContact = actorUser.contactNumber || '+91 98000 00000';

      // Admins are allowed to specify another resident's details to log complaints on their behalf
      if (actorUser.role === 'admin') {
        if (residentName) finalResidentName = String(residentName).trim();
        if (residentUnit) finalResidentUnit = String(residentUnit).trim();
        if (residentContact) finalResidentContact = String(residentContact).trim();

        const { residentId } = req.body;
        if (residentId) {
          const targetRes = await User.findOne({
            $or: [
              mongoose.Types.ObjectId.isValid(residentId) ? { _id: residentId } : null,
              { legacyId: residentId },
            ].filter(Boolean) as any[],
          });
          if (targetRes) {
            finalResidentId = targetRes._id;
          }
        }
      }

      const count = await Complaint.countDocuments();
      const nextCodeNum = 1040 + count + Math.floor(Math.random() * 5);
      const code = `CMP-${nextCodeNum}`;

      const settings = await getSettings();

      let finalPhotoUrl = photoUrl;
      if (photoUrl && String(photoUrl).startsWith('data:image/')) {
        if (process.env.CLOUDINARY_URL) {
          try {
            const uploadRes = await cloudinary.uploader.upload(String(photoUrl), {
              folder: 'society-tracker',
            });
            finalPhotoUrl = uploadRes.secure_url;
          } catch (uploadErr) {
            console.error('[Cloudinary] Upload failed:', uploadErr);
            if (!isDev) {
              // In production, do not fall back to storing raw base64 in MongoDB
              return res.status(500).json({ error: 'Photo upload failed. Please try again.' });
            }
            console.warn('[Cloudinary] Falling back to base64 (dev only).');
          }
        } else if (!isDev) {
          // Production without Cloudinary configured — reject rather than bloat MongoDB
          return res
            .status(400)
            .json({ error: 'Photo uploads require Cloudinary configuration in production.' });
        } else {
          console.warn('[Cloudinary] CLOUDINARY_URL not set, saving base64 (dev only).');
        }
      }

      const newComplaint = await Complaint.create({
        code,
        residentId: finalResidentId,
        residentName: finalResidentName,
        residentUnit: finalResidentUnit,
        residentContact: finalResidentContact,
        category,
        title: String(title).trim(),
        description: String(description).trim(),
        photoUrl: finalPhotoUrl || undefined,
        status: 'OPEN',
        priority: priority || 'MEDIUM',
      });

      // Initial history entry — actor is the authenticated user
      await ComplaintHistory.create({
        complaintId: newComplaint._id,
        previousStatus: 'OPEN',
        newStatus: 'OPEN',
        actorId: (actorUser as any)._id,
        actorName: actorUser.name,
        actorRole: actorUser.role,
        note: 'Complaint ticket registered.',
        createdAt: new Date(),
      });

      await sendSimulatedEmail(
        actorUser.email,
        actorUser.name,
        `Complaint Registered [${code}]: ${title}`,
        `Dear ${actorUser.name},\n\nYour complaint has been successfully registered under ticket ${code}.\nCategory: ${category}\nPriority: ${priority || 'MEDIUM'}\n\nOur maintenance team will inspect and update the status shortly.\n\nRegards,\n${settings.societyName} Helpdesk`,
        'COMPLAINT_CREATED',
        (newComplaint._id as any).toString()
      );

      res.status(201).json(await enrichComplaint(newComplaint, settings.overdueThresholdDays));
    } catch (err: any) {
      console.error('[Complaints POST]', err);
      res.status(500).json({ error: err.message || 'Failed to submit complaint.' });
    }
  }
);

// PATCH update status — admin only; actor derived from JWT
app.patch('/api/complaints/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const { newStatus, note, assignedTo, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid complaint ID.' });
    }

    const settings = await getSettings();

    await session.withTransaction(async () => {
      const complaint = await Complaint.findById(id).session(session);

      if (!complaint) {
        throw Object.assign(new Error('Complaint not found.'), { status: 404 });
      }

      const prevStatus = complaint.status;
      const now = new Date();

      if (newStatus && ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(newStatus)) {
        complaint.status = newStatus as ComplaintStatus;
        if (newStatus === 'RESOLVED') {
          complaint.resolvedAt = now;
        } else {
          complaint.resolvedAt = undefined;
        }
      }

      if (assignedTo !== undefined) complaint.assignedTo = assignedTo;

      if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
        complaint.priority = priority as ComplaintPriority;
      }

      complaint.updatedAt = now;
      await complaint.save({ session });

      // Actor identity comes entirely from the authenticated JWT — never from client payload
      await ComplaintHistory.create(
        [
          {
            complaintId: complaint._id,
            previousStatus: prevStatus,
            newStatus: complaint.status,
            actorId: new mongoose.Types.ObjectId(req.user!.userId),
            actorName: req.user!.name,
            actorRole: req.user!.role,
            note: note || `Status updated from ${prevStatus} to ${complaint.status}.`,
            createdAt: now,
          },
        ],
        { session }
      );

      const resident = await User.findById(complaint.residentId).lean().session(session);
      const recipientEmail = (resident as any)?.email || 'resident@society.org';
      await sendSimulatedEmail(
        recipientEmail,
        complaint.residentName,
        `Status Update [${complaint.code}]: Now ${complaint.status}`,
        `Dear ${complaint.residentName},\n\nYour complaint ${complaint.code} ("${complaint.title}") status has been updated to: ${complaint.status}.\n\nRemarks: ${note || 'None provided'}\nAssigned Service: ${complaint.assignedTo || 'Central Maintenance Team'}\n\nTrack your complaint on the resident portal.\n\nRegards,\n${settings.societyName}`,
        'STATUS_UPDATED',
        (complaint._id as any).toString()
      );

      res.json(await enrichComplaint(complaint, settings.overdueThresholdDays));
    });
  } catch (err: any) {
    console.error('[Status PATCH]', err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Failed to update status.' });
  } finally {
    session.endSession();
  }
});

// PATCH update priority — admin only
app.patch('/api/complaints/:id/priority', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid complaint ID.' });
    }

    const settings = await getSettings();
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      complaint.priority = priority as ComplaintPriority;
      complaint.updatedAt = new Date();
      await complaint.save();
    }

    res.json(await enrichComplaint(complaint, settings.overdueThresholdDays));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update priority.' });
  }
});

// ── 5. Notices ────────────────────────────────────────────────────────────────

// GET notices — requires authentication (residents and admins can view)
app.get('/api/notices', requireAuth, async (_req, res) => {
  try {
    const notices = await Notice.find().sort({ important: -1, createdAt: -1 }).lean();

    res.json(
      notices.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        content: n.content,
        category: n.category,
        important: n.important,
        authorId: n.authorId?.toString(),
        authorName: n.authorName,
        authorRole: n.authorRole,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notices.' });
  }
});

// POST create notice — admin only; author derived from JWT
app.post('/api/notices', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, content, category, important } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const settings = await getSettings();

    const newNotice = await Notice.create({
      title: String(title).trim(),
      content: String(content).trim(),
      category: category || (important ? 'IMPORTANT' : 'GENERAL'),
      important: Boolean(important),
      // Author identity comes from the authenticated JWT — never from client payload
      authorId: new mongoose.Types.ObjectId(req.user!.userId),
      authorName: req.user!.name,
      authorRole: req.user!.role,
    });

    if (newNotice.important) {
      await sendSimulatedEmail(
        'all-residents@silveroaks.org',
        'All Residents',
        `IMPORTANT NOTICE: ${title}`,
        `Dear Residents,\n\n${content}\n\nFor any queries, contact the society management office during office hours (${settings.workingHours}).\n\nRegards,\nManaging Committee, ${settings.societyName}`,
        'NOTICE_BROADCAST',
        (newNotice._id as any).toString()
      );
    }

    res.status(201).json({
      id: (newNotice._id as any).toString(),
      title: newNotice.title,
      content: newNotice.content,
      category: newNotice.category,
      important: newNotice.important,
      authorId: newNotice.authorId?.toString(),
      authorName: newNotice.authorName,
      authorRole: newNotice.authorRole,
      createdAt: newNotice.createdAt,
      updatedAt: newNotice.updatedAt,
    });
  } catch (err: any) {
    console.error('[Notices POST]', err);
    res.status(500).json({ error: err.message || 'Failed to create notice.' });
  }
});

// DELETE notice — admin only
app.delete('/api/notices/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid notice ID.' });
    }
    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Notice not found.' });
    }
    res.json({ success: true, message: 'Notice deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notice.' });
  }
});

// ── 6. Settings ───────────────────────────────────────────────────────────────

// GET settings — authenticated users (residents need workingHours etc.)
app.get('/api/settings', requireAuth, async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings.toJSON ? settings.toJSON() : settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// PUT update settings — admin only
app.put('/api/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      overdueThresholdDays,
      emailNotificationsEnabled,
      smsNotificationsEnabled,
      workingHours,
      societyName,
      autoAssignCategory,
    } = req.body;

    const update: Record<string, any> = {};
    if (typeof overdueThresholdDays === 'number' && overdueThresholdDays >= 1) {
      update.overdueThresholdDays = overdueThresholdDays;
    }
    if (typeof emailNotificationsEnabled === 'boolean') {
      update.emailNotificationsEnabled = emailNotificationsEnabled;
    }
    if (typeof smsNotificationsEnabled === 'boolean') {
      update.smsNotificationsEnabled = smsNotificationsEnabled;
    }
    if (typeof autoAssignCategory === 'boolean') {
      update.autoAssignCategory = autoAssignCategory;
    }
    if (workingHours) update.workingHours = workingHours;
    if (societyName) update.societyName = societyName;
    update.updatedAt = new Date();

    const updated = await Settings.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    res.json(updated?.toJSON ? updated.toJSON() : updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// ── 7. Email Logs — admin only ────────────────────────────────────────────────
app.get('/api/emails', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const emails = await EmailLog.find().sort({ sentAt: -1 }).limit(50).lean();

    res.json(
      emails.map((e: any) => ({
        id: e._id.toString(),
        to: e.to,
        recipientName: e.recipientName,
        subject: e.subject,
        body: e.body,
        type: e.type,
        referenceId: e.referenceId,
        sentAt: e.sentAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch email logs.' });
  }
});

// ── 8. Admin Reset ────────────────────────────────────────────────────────────
app.post('/api/admin/reset-demo', requireAuth, requireAdmin, async (_req, res) => {
  try {
    res.json({
      message:
        'Demo reset: please re-run "npx tsx scripts/migrate.ts" to restore seed data.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed.' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Start Server
// ══════════════════════════════════════════════════════════════════════════════
async function startServer() {
  await connectDB();

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Society Maintenance Tracker running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
