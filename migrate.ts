/**
 * Migration Script: data-store.json → MongoDB Atlas
 *
 * Usage:
 *   npx tsx scripts/migrate.ts
 *
 * Safety:
 *   - Idempotent: uses legacyId checks to skip already-migrated records.
 *   - Does NOT delete data-store.json.
 *   - Prints a full summary on completion.
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './server/db.js';
import User from './server/models/User.js';
import Complaint from './server/models/Complaint.js';
import ComplaintHistory from './server/models/ComplaintHistory.js';
import Notice from './server/models/Notice.js';
import Settings, { getSettings } from './server/models/Settings.js';
import EmailLog from './server/models/EmailLog.js';

// ── Types for the legacy JSON structure ──────────────────────────────────────

interface LegacyUser {
  id: string;
  name: string;
  email: string;
  role: 'resident' | 'admin';
  unitNumber: string;
  contactNumber: string;
  avatarUrl?: string;
  createdAt: string;
}

interface LegacyComplaint {
  id: string;
  code: string;
  residentId: string;
  residentName: string;
  residentUnit: string;
  residentContact: string;
  category: string;
  title: string;
  description: string;
  photoUrl?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface LegacyHistory {
  id: string;
  complaintId: string;
  previousStatus: string;
  newStatus: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  note?: string;
  timestamp: string;
}

interface LegacyNotice {
  id: string;
  title: string;
  content: string;
  category: string;
  important: boolean;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  updatedAt: string;
}

interface LegacySettings {
  societyName: string;
  overdueThresholdDays: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  autoAssignCategory: boolean;
  workingHours: string;
  updatedAt: string;
}

interface LegacyEmailLog {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  type: string;
  referenceId?: string;
  sentAt: string;
}

interface LegacyDB {
  users: LegacyUser[];
  complaints: LegacyComplaint[];
  history: LegacyHistory[];
  notices: LegacyNotice[];
  settings: LegacySettings;
  emailLogs: LegacyEmailLog[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[MIGRATE] ${msg}`);
}

function warn(msg: string) {
  console.warn(`[MIGRATE] ⚠️  ${msg}`);
}

function ok(msg: string) {
  console.log(`[MIGRATE] ✅  ${msg}`);
}

// ── Main Migration ────────────────────────────────────────────────────────────

async function migrate() {
  // 1. Load data-store.json
  const dbFilePath = path.join(process.cwd(), 'data-store.json');
  if (!fs.existsSync(dbFilePath)) {
    throw new Error(`data-store.json not found at: ${dbFilePath}`);
  }
  const raw = fs.readFileSync(dbFilePath, 'utf-8');
  const legacy: LegacyDB = JSON.parse(raw);

  log(`Loaded data-store.json: ${legacy.users.length} users, ${legacy.complaints.length} complaints, ` +
      `${legacy.history.length} history items, ${legacy.notices.length} notices, ` +
      `${legacy.emailLogs.length} email logs`);

  // 2. Connect to MongoDB
  await connectDB();

  if (process.argv.includes('--clean')) {
    log('Wiping database for a clean migration (--clean detected)...');
    await mongoose.connection.db.dropDatabase();
  }

  // ── Build a legacyId → ObjectId map for relational lookups ─────────────────
  const userIdMap = new Map<string, mongoose.Types.ObjectId>();
  const complaintIdMap = new Map<string, mongoose.Types.ObjectId>();

  // ── 3. Migrate Users ────────────────────────────────────────────────────────
  log('Migrating users...');
  let usersInserted = 0;
  let usersSkipped = 0;

  for (const lu of legacy.users) {
    const existing = await User.findOne({ legacyId: lu.id });
    if (existing) {
      userIdMap.set(lu.id, existing._id as mongoose.Types.ObjectId);
      usersSkipped++;
      continue;
    }

    // Check email uniqueness
    const byEmail = await User.findOne({ email: lu.email.toLowerCase() });
    if (byEmail) {
      warn(`User email "${lu.email}" already exists (no legacyId). Mapping to existing.`);
      await User.findByIdAndUpdate(byEmail._id, { legacyId: lu.id });
      userIdMap.set(lu.id, byEmail._id as mongoose.Types.ObjectId);
      usersSkipped++;
      continue;
    }

    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const newUser = await User.create({
      name: lu.name,
      email: lu.email.toLowerCase(),
      role: lu.role,
      unitNumber: lu.unitNumber,
      contactNumber: lu.contactNumber || '+91 90000 00000',
      avatarUrl: lu.avatarUrl,
      passwordHash: defaultPasswordHash,
      legacyId: lu.id,
      createdAt: new Date(lu.createdAt),
    });

    userIdMap.set(lu.id, newUser._id as mongoose.Types.ObjectId);
    usersInserted++;
  }

  ok(`Users: ${usersInserted} inserted, ${usersSkipped} skipped (already exist).`);

  // ── 4. Migrate Complaints ───────────────────────────────────────────────────
  log('Migrating complaints...');
  let complaintsInserted = 0;
  let complaintsSkipped = 0;

  for (const lc of legacy.complaints) {
    const existing = await Complaint.findOne({ legacyId: lc.id });
    if (existing) {
      complaintIdMap.set(lc.id, existing._id as mongoose.Types.ObjectId);
      complaintsSkipped++;
      continue;
    }

    const residentObjectId = userIdMap.get(lc.residentId);
    if (!residentObjectId) {
      warn(`Complaint "${lc.id}" references unknown residentId "${lc.residentId}". Skipping.`);
      continue;
    }

    const newComplaint = await Complaint.create({
      code: lc.code,
      residentId: residentObjectId,
      residentName: lc.residentName,
      residentUnit: lc.residentUnit,
      residentContact: lc.residentContact,
      category: lc.category as any,
      title: lc.title,
      description: lc.description,
      photoUrl: lc.photoUrl,
      status: lc.status as any,
      priority: lc.priority as any,
      assignedTo: lc.assignedTo,
      resolvedAt: lc.resolvedAt ? new Date(lc.resolvedAt) : undefined,
      legacyId: lc.id,
      createdAt: new Date(lc.createdAt),
      updatedAt: new Date(lc.updatedAt),
    });

    complaintIdMap.set(lc.id, (newComplaint as any)._id as mongoose.Types.ObjectId);
    complaintsInserted++;
  }

  ok(`Complaints: ${complaintsInserted} inserted, ${complaintsSkipped} skipped.`);

  // ── 5. Migrate Complaint History ────────────────────────────────────────────
  log('Migrating complaint history...');
  let historyInserted = 0;
  let historySkipped = 0;

  for (const lh of legacy.history) {
    const existing = await ComplaintHistory.findOne({ legacyId: lh.id });
    if (existing) {
      historySkipped++;
      continue;
    }

    const complaintObjectId = complaintIdMap.get(lh.complaintId);
    const actorObjectId = userIdMap.get(lh.actorId);

    if (!complaintObjectId) {
      warn(`History "${lh.id}" references unknown complaintId "${lh.complaintId}". Skipping.`);
      continue;
    }
    if (!actorObjectId) {
      warn(`History "${lh.id}" references unknown actorId "${lh.actorId}". Skipping.`);
      continue;
    }

    await ComplaintHistory.create({
      complaintId: complaintObjectId,
      previousStatus: lh.previousStatus as any,
      newStatus: lh.newStatus as any,
      actorId: actorObjectId,
      actorName: lh.actorName,
      actorRole: lh.actorRole as any,
      note: lh.note,
      legacyId: lh.id,
      createdAt: new Date(lh.timestamp),
    });

    historyInserted++;
  }

  ok(`History: ${historyInserted} inserted, ${historySkipped} skipped.`);

  // ── 6. Migrate Notices ──────────────────────────────────────────────────────
  log('Migrating notices...');
  let noticesInserted = 0;
  let noticesSkipped = 0;

  for (const ln of legacy.notices) {
    const existing = await Notice.findOne({ legacyId: ln.id });
    if (existing) {
      noticesSkipped++;
      continue;
    }

    const authorObjectId = userIdMap.get(ln.authorId);
    if (!authorObjectId) {
      warn(`Notice "${ln.id}" references unknown authorId "${ln.authorId}". Skipping.`);
      continue;
    }

    await Notice.create({
      title: ln.title,
      content: ln.content,
      category: ln.category as any,
      important: ln.important,
      authorId: authorObjectId,
      authorName: ln.authorName,
      authorRole: ln.authorRole,
      legacyId: ln.id,
      createdAt: new Date(ln.createdAt),
      updatedAt: new Date(ln.updatedAt),
    });

    noticesInserted++;
  }

  ok(`Notices: ${noticesInserted} inserted, ${noticesSkipped} skipped.`);

  // ── 7. Migrate Settings ─────────────────────────────────────────────────────
  log('Migrating settings...');
  const existingSettings = await Settings.findOne();
  if (existingSettings) {
    log('Settings already exist in MongoDB. Updating with JSON values...');
    await Settings.findByIdAndUpdate(existingSettings._id, {
      societyName: legacy.settings.societyName,
      overdueThresholdDays: legacy.settings.overdueThresholdDays,
      emailNotificationsEnabled: legacy.settings.emailNotificationsEnabled,
      smsNotificationsEnabled: legacy.settings.smsNotificationsEnabled,
      autoAssignCategory: legacy.settings.autoAssignCategory,
      workingHours: legacy.settings.workingHours,
      updatedAt: new Date(legacy.settings.updatedAt),
    });
    ok('Settings: updated existing document.');
  } else {
    await Settings.create({
      societyName: legacy.settings.societyName,
      overdueThresholdDays: legacy.settings.overdueThresholdDays,
      emailNotificationsEnabled: legacy.settings.emailNotificationsEnabled,
      smsNotificationsEnabled: legacy.settings.smsNotificationsEnabled,
      autoAssignCategory: legacy.settings.autoAssignCategory,
      workingHours: legacy.settings.workingHours,
      updatedAt: new Date(legacy.settings.updatedAt),
    });
    ok('Settings: created new document.');
  }

  // ── 8. Migrate Email Logs ───────────────────────────────────────────────────
  log('Migrating email logs...');
  let emailsInserted = 0;
  let emailsSkipped = 0;

  for (const el of legacy.emailLogs) {
    // EmailLog has no legacyId, deduplicate by subject + sentAt
    const existing = await EmailLog.findOne({
      subject: el.subject,
      sentAt: new Date(el.sentAt),
    });
    if (existing) {
      emailsSkipped++;
      continue;
    }

    await EmailLog.create({
      to: el.to,
      recipientName: el.recipientName,
      subject: el.subject,
      body: el.body,
      type: el.type as any,
      referenceId: el.referenceId,
      sentAt: new Date(el.sentAt),
    });

    emailsInserted++;
  }

  ok(`Email logs: ${emailsInserted} inserted, ${emailsSkipped} skipped.`);

  // ── 9. Verification ─────────────────────────────────────────────────────────
  log('');
  log('── Verification Report ──────────────────────────────────────────');

  const [dbUsers, dbComplaints, dbHistory, dbNotices, dbSettings, dbEmails] =
    await Promise.all([
      User.countDocuments(),
      Complaint.countDocuments(),
      ComplaintHistory.countDocuments(),
      Notice.countDocuments(),
      Settings.countDocuments(),
      EmailLog.countDocuments(),
    ]);

  console.log(`
  Collection         | JSON Source | MongoDB Now
  -------------------|-------------|------------
  Users              | ${String(legacy.users.length).padEnd(11)} | ${dbUsers}
  Complaints         | ${String(legacy.complaints.length).padEnd(11)} | ${dbComplaints}
  Complaint History  | ${String(legacy.history.length).padEnd(11)} | ${dbHistory}
  Notices            | ${String(legacy.notices.length).padEnd(11)} | ${dbNotices}
  Settings           | 1           | ${dbSettings}
  Email Logs         | ${String(legacy.emailLogs.length).padEnd(11)} | ${dbEmails}
  `);

  // Cross-reference checks
  const orphanedHistory = await ComplaintHistory.countDocuments({
    complaintId: { $nin: await Complaint.distinct('_id') },
  });
  if (orphanedHistory > 0) {
    warn(`${orphanedHistory} orphaned history records found!`);
  } else {
    ok('No orphaned history records.');
  }

  const orphanedComplaints = await Complaint.countDocuments({
    residentId: { $nin: await User.distinct('_id') },
  });
  if (orphanedComplaints > 0) {
    warn(`${orphanedComplaints} complaints with missing resident references!`);
  } else {
    ok('All complaint → resident references valid.');
  }

  log('');
  ok('Migration complete! data-store.json has NOT been deleted.');
  log('Run "npm run dev" to start the server with MongoDB.');
}

migrate()
  .catch((err) => {
    console.error('[MIGRATE] ❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
