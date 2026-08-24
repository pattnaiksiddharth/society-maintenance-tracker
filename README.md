Society Maintenance Tracker
A complaint-tracking and notice board app for residential societies. Residents raise maintenance complaints (with an optional photo), track their status, and read society notices. Admins triage complaints, update status/priority, and post notices.
Stack: React 19 + Vite (frontend) · Express + Mongoose/MongoDB (backend, run in the same process) · JWT auth via httpOnly cookie · deployed as a single Vercel project (static frontend + `/api/*` serverless function).
---
1. Setup Guide
Prerequisites
Node.js 18+
A MongoDB connection string (MongoDB Atlas free tier works fine)
Install & run locally
```bash
git clone <your-repo-url>
cd society-maintenance-tracker
npm install

cp .env.example .env
# fill in MONGODB_URI and JWT_SECRET at minimum — see section 2

npm run dev
```
`npm run dev` starts the Express server (`server/app.ts`) directly via `tsx` on `PORT` (default `3000`). This single server serves both the API and, in production, the built frontend.
For local frontend development with hot reload, you can instead run Vite directly against the API:
```bash
npx vite        # serves the React app on :5173, proxying to the Express API
```
Seeding demo data (optional)
The repo ships with `data-store.json`, a snapshot of demo users, complaints, history, notices, and email logs from an earlier prototype. A one-time, idempotent migration script loads it into MongoDB:
```bash
npm run migrate
```
This is safe to re-run — it checks `legacyId` fields and skips records already migrated. It does not delete `data-store.json`.
Demo accounts created by the migration (all share the password `password123` unless a real hash already exists):
Email	Role	Unit
anil@society.org	admin	Admin Office
vikram@society.org	resident	A-402
sara@society.org	resident	B-105
rajesh@society.org	resident	C-708
sunita@society.org	resident	D-302
You can also just register a fresh account via `POST /api/auth/register` (or the sign-up form) — the database does not require the seed data.
Build & run in production mode
```bash
npm run build   # vite build (frontend) + esbuild bundles server/app.ts -> dist/server.cjs
npm start       # node dist/server.cjs
```
Deploying to Vercel
The repo is pre-configured for Vercel:
`vercel.json` rewrites `/api/*` to the single serverless function at `api/[...path].ts`, which lazily connects to MongoDB (`connectDB()`, connection-reused across invocations) and hands the request to the same Express `app` used locally.
All non-`/api` routes are rewritten to `index.html` (SPA fallback).
Set the environment variables from section 2 in the Vercel project settings (Production + Preview). `NODE_ENV=production` is set automatically by Vercel.
No separate backend host is needed — frontend and API deploy together as one Vercel project.
---
2. Environment Variables (`.env.example`)
Copy `.env.example` to `.env` and fill in real values. Never commit `.env`.
```env
# ── Runtime ───────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000

# ── MongoDB ───────────────────────────────────────────────────────────────
# Atlas format: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
MONGODB_URI=your_mongodb_connection_string_here

# ── JWT Authentication ──────────────────────────────────────────────────────
# REQUIRED. Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_strong_random_jwt_secret_here
JWT_EXPIRES_IN=1d

# ── CORS ──────────────────────────────────────────────────────────────────
# In production, set to your deployed frontend URL (e.g. https://yourdomain.com).
FRONTEND_URL=http://localhost:3000

# ── App URL ───────────────────────────────────────────────────────────────
APP_URL=http://localhost:3000

# ── Gemini API (optional — not currently called by any route) ─────────────
GEMINI_API_KEY=your_gemini_api_key_here

# ── Cloudinary (present as a dependency; not yet wired into any upload route —
#    see "Photo Handling" in the design write-up) ──────────────────────────
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# ── SMTP Email (present as a dependency; not yet wired into any send path —
#    see "Notification Flow" in the design write-up) ───────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=Society Tracker <your_email@gmail.com>
```
Required to boot the app at all: `MONGODB_URI`, `JWT_SECRET`. Everything else has a safe default or is currently unused by the live code path (see design write-up for details).
`ALLOWED_ORIGINS` (comma-separated) can also be set to override the default CORS allow-list (`localhost:5173`, `localhost:3000`, and any `*.vercel.app` origin).
---
3. API Documentation
All endpoints are prefixed with `/api`. Authenticated endpoints read a JWT from the httpOnly `auth_token` cookie set at login/register — there is no `Authorization: Bearer` header flow. All requests from a browser client must include `credentials: 'include'`.
Auth — `/api/auth` (rate-limited: 20 req / 15 min)
Method	Path	Auth	Description
POST	`/login`	none	Body: `{ email, password }`. Sets `auth_token` cookie. Returns the user profile.
POST	`/register`	none	Body: `{ name, email, unitNumber, contactNumber?, role?, password? }`. Creates a `resident` unless `role: "admin"` is passed. Defaults password to `password123` if omitted. Sets `auth_token` cookie.
POST	`/logout`	none	Clears the `auth_token` cookie.
GET	`/me`	required	Returns the logged-in user's profile.
GET	`/users`	admin	Returns all users (used by the admin persona switcher).
Complaints — `/api/complaints` (all routes require auth)
Method	Path	Auth	Description
GET	`/`	resident/admin	List complaints. Residents are auto-filtered to their own; admins can pass any `residentId`. Query params: `status`, `category`, `priority`, `overdueOnly=true`, `residentId`, `search` (regex over title/description/code).
POST	`/`	resident/admin	Create a complaint. Body requires `residentId, category, title, description`; `photoUrl` and `priority` optional. Server generates a unique `code` (`C-YYYY-NNNNNN`).
GET	`/:id`	resident/admin	Fetch one complaint. Residents get `403` on complaints they don't own.
PATCH	`/:id/status`	resident/admin	Body: `{ newStatus, actorId, actorName, actorRole, note?, assignedTo?, priority? }`. Writes a `ComplaintHistory` entry, updates the complaint, and stamps `resolvedAt` when `newStatus === 'RESOLVED'`.
PATCH	`/:id/priority`	resident/admin	Body: `{ priority }`. Updates priority only (no history entry written).
Notices — `/api/notices` (all routes require auth)
Method	Path	Auth	Description
GET	`/`	any	List notices, important-first then newest-first.
POST	`/`	admin	Body: `{ title, content, category?, important?, authorId, authorName, authorRole? }`.
DELETE	`/:id`	admin	Delete a notice.
Stats — `/api/stats`
Method	Path	Auth	Description
GET	`/`	any	Returns `{ total, open, inProgress, resolved, overdue, totalResidents }` for the dashboard. `overdue` = non-resolved complaints older than 7 days (hardcoded — see design write-up).
Settings — `/api/settings`
Method	Path	Auth	Description
GET	`/`	any	Returns the singleton settings document (auto-created on first read if missing).
PUT	`/`	admin	Partial update, e.g. `{ overdueThresholdDays, emailNotificationsEnabled, ... }`.
Emails — `/api/emails`
Method	Path	Auth	Description
GET	`/`	admin	Returns the `EmailLog` collection, newest first — a historical/audit view, not a live outbox (see design write-up).
Admin — `/api/admin`
Method	Path	Auth	Description
POST	`/reset-demo`	admin	Wipes `Complaint`, `ComplaintHistory`, `Notice`, `EmailLog` collections. Users and Settings are preserved.
Misc
Method	Path	Auth	Description
GET	`/api/health`	none	Liveness check: `{ status: 'ok', timestamp }`.
All error responses are `{ "error": "<message>" }` with an appropriate 4xx/5xx status. Global rate limit: 200 req / 15 min per IP across the whole API; auth routes additionally limited to 20 req / 15 min.
---
4. Database Schema
MongoDB via Mongoose. Database name: `society-tracker`. Six collections:
`users`
Field	Type	Notes
name	String	required, ≤100 chars
email	String	required, unique, lowercased
role	`'resident' | 'admin'`	default `resident`
unitNumber	String	required
contactNumber	String	default `+91 90000 00000`
avatarUrl	String	optional
passwordHash	String	bcrypt hash, required
legacyId	String	sparse index, migration only
createdAt / updatedAt	Date	auto
Index: `{ role: 1 }`.
`complaints`
Field	Type	Notes
code	String	required, unique — `C-YYYY-NNNNNN`
residentId	ObjectId → User	required
residentName / residentUnit / residentContact	String	denormalized copy of the resident's info at submit time
category	Enum	Plumbing, Electrical, Elevator, Water, Carpentry, HVAC, Common Area, Security, Pest Control, Other
title	String	required, ≤300 chars
description	String	required
photoUrl	String	optional — base64 data URL or external image URL (see design write-up)
status	Enum	`OPEN | IN_PROGRESS | RESOLVED`, default `OPEN`
priority	Enum	`LOW | MEDIUM | HIGH`, default `MEDIUM`
assignedTo	String	optional
resolvedAt	Date	set when status becomes `RESOLVED`
legacyId	String	sparse index, migration only
createdAt / updatedAt	Date	auto
Indexes: `code` (unique), `residentId`, `category`, `status`, `priority`, plus compound indexes `{status,createdAt}`, `{category,status}`, `{priority,status}`, `{residentId,createdAt}` for admin filtering.
`complainthistories`
Immutable audit trail of status transitions.
Field	Type	Notes
complaintId	ObjectId → Complaint	required
previousStatus / newStatus	Enum	complaint status values
actorId	ObjectId → User	who made the change
actorName	String	denormalized
actorRole	`'resident' | 'admin'`	
note	String	optional
legacyId	String	sparse index, migration only
createdAt	Date	auto (`updatedAt` disabled — history is append-only)
Index: `{ complaintId: 1, createdAt: -1 }`.
`notices`
Field	Type	Notes
title	String	required, ≤200 chars
content	String	required
category	Enum	`IMPORTANT | MAINTENANCE | EVENT | LIFESTYLE | GENERAL`, default `GENERAL`
important	Boolean	default `false`
authorId	ObjectId → User	required
authorName / authorRole	String	denormalized
legacyId	String	sparse index, migration only
createdAt / updatedAt	Date	auto
Index: `{ important: -1, createdAt: -1 }`.
`settings`
Singleton document (one row, auto-created on first read).
Field	Type	Default
societyName	String	`Silver Oaks Residency`
overdueThresholdDays	Number	`7` (1–365)
emailNotificationsEnabled	Boolean	`true`
smsNotificationsEnabled	Boolean	`false`
autoAssignCategory	Boolean	`true`
workingHours	String	`08:00 AM - 08:00 PM`
updatedBy	ObjectId → User	optional
updatedAt	Date	auto
`emaillogs`
Record of notification-worthy events. Currently populated only by the migration script (see design write-up).
Field	Type	Notes
to	String	recipient email
recipientName	String	
subject	String	
body	String	
type	Enum	`COMPLAINT_CREATED | STATUS_UPDATED | PRIORITY_CHANGED | NOTICE_BROADCAST | OVERDUE_ALERT`
referenceId	String	optional, e.g. complaint code
sentAt	Date	default now
Indexes: `{ sentAt: -1 }`, `{ type: 1 }`.
All schemas use Mongoose's `toJSON.transform` to rewrite `_id` → `id` (string) and strip `__v`, matching the frontend's TypeScript contracts in `src/types.ts`.
---
Project Structure
```
society-maintenance-tracker/
├── api/[...path].ts        # Vercel serverless entrypoint (wraps the Express app)
├── server/
│   ├── app.ts               # Express app: middleware, routes, error handling
│   ├── db.ts                 # MongoDB connection (cached across invocations)
│   ├── models/                # Mongoose schemas (User, Complaint, ComplaintHistory, Notice, Settings, EmailLog)
│   ├── routes/                 # auth, complaints, notices, stats, settings, emails, admin
│   └── middleware/auth.ts       # JWT cookie issuing/verification, requireAuth, requireAdmin
├── src/                        # React frontend (components, context, services/api.ts, types.ts)
├── migrate.ts / scripts/migrate.ts   # data-store.json → MongoDB one-time seed
├── data-store.json             # legacy demo dataset consumed by the migration script
└── vercel.json                  # rewrites for SPA + API routing
```

**LIVE DEMO**- 
https://society-maintenance-tracker-virid.vercel.app/
