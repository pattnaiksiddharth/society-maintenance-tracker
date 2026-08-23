import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {
  generateToken,
  setCookieToken,
  clearCookieToken,
  requireAuth,
  requireAdmin,
} from '../middleware/auth.js';

const router = Router();

// ─── POST /api/auth/login ────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password ?? '', user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      userId: (user._id as any).toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    });

    setCookieToken(res, token);

    res.json({
      id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      unitNumber: user.unitNumber,
      contactNumber: user.contactNumber,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      unitNumber,
      contactNumber,
      role,
      password,
    } = req.body as {
      name?: string;
      email?: string;
      unitNumber?: string;
      contactNumber?: string;
      role?: string;
      password?: string;
    };

    if (!name || !email || !unitNumber) {
      res.status(400).json({ error: 'Name, email, and unit number are required.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const rawPassword = password ?? 'password123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role === 'admin' ? 'admin' : 'resident',
      unitNumber: unitNumber.trim(),
      contactNumber: contactNumber?.trim() || '+91 90000 00000',
      passwordHash,
    });

    const token = generateToken({
      userId: (newUser._id as any).toString(),
      role: newUser.role,
      email: newUser.email,
      name: newUser.name,
    });

    setCookieToken(res, token);

    res.status(201).json({
      id: (newUser._id as any).toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      unitNumber: newUser.unitNumber,
      contactNumber: newUser.contactNumber,
      avatarUrl: newUser.avatarUrl,
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  clearCookieToken(res);
  res.json({ message: 'Logged out successfully.' });
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      id: (user._id as any).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      unitNumber: user.unitNumber,
      contactNumber: user.contactNumber,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error('[Auth] /me error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ─── GET /api/auth/users ─────────────────────────────────────────────────────

router.get('/users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(
      users.map((u) => ({
        id: (u._id as any).toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        unitNumber: u.unitNumber,
        contactNumber: u.contactNumber,
        avatarUrl: u.avatarUrl,
      }))
    );
  } catch (err) {
    console.error('[Auth] /users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

export default router;
