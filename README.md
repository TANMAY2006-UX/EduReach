<div align="center">

<!-- Animated Header Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=200&section=header&text=EduReach&fontSize=80&fontAlignY=35&animation=twinkling&fontColor=ffffff&desc=Verified%20Tutor–Student%20Matching%20Platform&descAlignY=60&descSize=20" width="100%"/>

<!-- Badges Row 1 -->
<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</p>

<!-- Badges Row 2 -->
<p align="center">
  <img src="https://img.shields.io/badge/Passport.js-Auth-34E27A?style=for-the-badge&logo=passport&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_OAuth2-Enabled-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudinary-File_Upload-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-HttpOnly_Cookies-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/SDG_4-Quality_Education-E5243B?style=for-the-badge" />
</p>

<!-- SDG Alignment -->
<p align="center">
  <img src="https://img.shields.io/badge/Academic_Prototype-DBIT_Mumbai-FF6B35?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Team-4_Members-8B5CF6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Advisor-Prof._Shiv_Negi-0EA5E9?style=for-the-badge" />
</p>

<br/>

> ### 🎯 *Connecting verified tutors with students & NGOs — making quality education accessible across Mumbai.*

<br/>

</div>

---

## 📖 Table of Contents

| # | Section |
|---|---------|
| 1 | [What is EduReach?](#-what-is-edureach) |
| 2 | [Why We Built This](#-why-we-built-this) |
| 3 | [What Makes It Different](#-what-makes-it-different) |
| 4 | [Platform Architecture](#-platform-architecture) |
| 5 | [Full Feature Breakdown](#-full-feature-breakdown) |
| 6 | [Tech Stack Deep Dive](#-tech-stack-deep-dive) |
| 7 | [Project Structure](#-project-structure) |
| 8 | [Complete Setup Guide](#-complete-setup-guide) |
| 9 | [Environment Variables](#-environment-variables) |
| 10 | [Running the Project](#-running-the-project) |
| 11 | [All User Flows Explained](#-all-user-flows-explained) |
| 12 | [API Reference](#-api-reference) |
| 13 | [Key Engineering Decisions](#-key-engineering-decisions) |
| 14 | [Bugs Fixed & Lessons Learned](#-bugs-fixed--lessons-learned) |
| 15 | [Team](#-team) |

---

## 🌍 What is EduReach?

**EduReach** is a full-stack, production-grade **tutor–student matching platform** built for the Mumbai market. It is an academic prototype developed by a four-person IT student team from **DBIT (Don Bosco Institute of Technology)** as part of an SDG 4 (Quality Education) initiative, advised by **Prof. Shiv Negi**.

The platform solves a real problem: **finding trustworthy, background-verified tutors is hard**, especially for underserved communities and NGOs trying to educate beneficiary students at scale.

EduReach brings three user roles together on a single platform:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│   🎓 STUDENTS  ──────► Browse & book verified tutors            │
│                                                                   │
│   📚 TUTORS    ──────► Manage sessions, build reputation        │
│                                                                   │
│   🤝 NGOs      ──────► Empanel tutors, assign cohorts           │
│                                                                   │
│   🛡️  ADMIN    ──────► Verify credentials, oversee platform     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔥 Why We Built This

Private tutoring in India is a **₹60,000+ crore industry** — yet it is completely unregulated, unsafe, and inaccessible to students who need it most.

**The problems we identified:**

- 🚫 No credential verification for tutors — anyone can call themselves a tutor
- 📵 Discovery happens via word-of-mouth or WhatsApp groups — no structured platform
- 💸 NGOs funding education have no way to match beneficiaries with tutors at scale
- 🗃️ No session tracking, review history, or accountability mechanisms exist

**EduReach is our answer.** We built:
- Admin-verified credential checks (ID + degree uploaded, admin approves)
- Structured booking flows with trial sessions (always free, always online for safety)
- A full NGO collaboration system — empanel tutors, send requests, assign cohorts
- End-to-end session lifecycle: request → accept → join → complete → review

---

## ✨ What Makes It Different

| Feature | EduReach | Generic Platforms |
|---------|----------|------------------|
| **Tutor Verification** | Full document upload (Aadhaar + Degree) → Admin review | ❌ Self-declared |
| **Free Trial Safety** | Trials are forced online for student safety | ❌ No such gate |
| **NGO Collaboration System** | Full empanelment → request → assignment pipeline | ❌ Nonexistent |
| **Meeting Link Security** | Tutor adds link only after acceptance; student joins via platform | ❌ External links |
| **Review Split** | Public review (visible) + Private feedback (tutor only) | ❌ Single channel |
| **Cross-Tab Session Sync** | BroadcastChannel API — logout in one tab, all tabs logout | ❌ Stale sessions |
| **WhatsApp Reveal Gate** | Phone numbers only revealed after session acceptance | ❌ Public exposure |
| **Booking Uniqueness** | One active trial per tutor per student (not lifetime block) | ❌ Naive blocks |
| **Geospatial Indexing** | MongoDB 2dsphere index for proximity tutor search | ❌ Manual filtering |
| **Offline-safe Pre-save Hooks** | Mongoose `function(next)` pattern — no async arrow crashes | ❌ Silent failures |

---

## 🏗️ Platform Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                           │
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Auth    │  │  Public  │  │ Dashboards│  │  Admin   │             │
│  │  Pages   │  │  Browse  │  │ St/Tu/NGO │  │  Panel   │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       └─────────────┴──────────────┴──────────────┘                   │
│                           Axios + HttpOnly Cookie                      │
└────────────────────────────┬───────────────────────────────────────────┘
                             │ HTTPS REST API
┌────────────────────────────▼───────────────────────────────────────────┐
│                     SERVER (Node.js + Express CJS)                     │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Middleware: Passport.js Auth ─── JWT Cookie ─── Role Guard    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Routes:  /auth  /tutors  /sessions  /ngo  /upload  /admin           │
│                                                                        │
│  Controllers: auth ─ tutor ─ session ─ ngo ─ collab ─ upload ─ admin │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
         ┌───────────────────┼────────────────────┐
         ▼                   ▼                    ▼
   ┌──────────┐       ┌──────────┐        ┌──────────────┐
   │ MongoDB  │       │Cloudinary│        │ Google OAuth │
   │ Mongoose │       │  Media   │        │  Passport    │
   │ (Atlas)  │       │  Store   │        │  Strategy    │
   └──────────┘       └──────────┘        └──────────────┘
```

---

## 🎛️ Full Feature Breakdown

<details>
<summary><strong>🔐 Authentication System</strong></summary>

- **Local Auth** — Email/password with bcrypt (12 salt rounds)
- **Google OAuth 2.0** — Passport.js strategy, account linking if email exists
- **JWT** stored in **HttpOnly cookies** (not localStorage — XSS safe)
- **7-day session** with 5-minute silent polling to catch server-side expiry
- **BroadcastChannel API** — cross-tab logout sync in real time
- **Visibility API** — re-validates session when user returns to tab
- **GuestRoute / ProtectedRoute / OnboardingRoute** — layered route guards

</details>

<details>
<summary><strong>🧙 Multi-Step Onboarding Wizard</strong></summary>

- **Step 0** — Role selection (Student / Tutor / NGO)
- **Step 1** — Phone, subjects, grade/board (student) or org name (NGO)
- **Step 2** — Tutor-only: experience, qualification, bio (min 30 chars)
- **Step 3** — Document upload (role-specific required docs)
- **Step 4** — Location: city + area
- Role saved to DB immediately after Step 0 (so document uploads work mid-flow)
- Auto-creates `TutorProfile` on tutor onboarding completion

</details>

<details>
<summary><strong>📋 Document Verification Pipeline</strong></summary>

- **Tutors**: Degree certificate + Aadhaar + optional certifications
- **Students**: School ID card
- **NGOs**: Registration proof (80G / 12A / Trust Deed) + Aadhaar
- All files → Cloudinary (role/userId scoped folders, Aadhaar in `/restricted`)
- `aadhaar` field is `select: false` — never returned in any non-admin API
- Admin reviews docs, approves/rejects with note → user sees status in dashboard
- On approval → `TutorProfile.isVerified = true` synced automatically

</details>

<details>
<summary><strong>🔍 Browse & Discovery</strong></summary>

- Full-text search (MongoDB text index on name, bio, subjects)
- Filter by subject, area, sort by rating / reviews / newest
- Debounced search (400ms) — no request spam
- Skeleton loading cards — zero layout shift
- Role-aware CTAs: tutors see "View Profile", students see "Book Trial"
- "New" badge instead of 0-star rating for new tutors
- Geospatial `$near` query for proximity-based recommendations

</details>

<details>
<summary><strong>📅 5-Step Booking Modal</strong></summary>

1. **Session Type** — Free Trial (₹0, forced online) or Paid Session
2. **Subject + Mode** — select subject, online/in-person (trials always online)
3. **Date Picker** — 14-day carousel filtered by tutor's availability slots
4. **Time Slot** — half-hour grid filtered by tutor's schedule for that day
5. **Confirm** — full summary with icebreaker prompts, booking summary card

- Graceful 409 handling for duplicate trial bookings
- Trial uniqueness is **per-tutor**, not global (student can trial multiple tutors)

</details>

<details>
<summary><strong>🎓 Student Dashboard</strong></summary>

- Upcoming vs Past session tabs (time-aware: accepted sessions auto-move to past 4h after start)
- "Join Class" button activates 5 minutes before session, with countdown
- WhatsApp link to tutor revealed only after session acceptance
- Pending reviews banner — nudges students to rate completed sessions
- Recommended tutors section (area + subject matched)
- Cancel booking with confirmation flow
- Public + Private review modal (star rating + comment + private feedback)

</details>

<details>
<summary><strong>📚 Tutor Dashboard</strong></summary>

- Requests tab — Accept / Decline incoming bookings with trial/paid badge
- Schedule tab — upcoming confirmed sessions
- History tab — completed/cancelled sessions
- Meeting link input — tutor adds Google Meet / Zoom link post-acceptance
- Mark Done button — guarded: online sessions require student to have joined via EduReach first
- Reschedule modal — tutor can propose new datetime with note to student
- NGO Partners tab — incoming collaboration requests + active assignments
- Profile card + Edit Profile modal (bio, rate, subjects, availability, verification docs)

</details>

<details>
<summary><strong>🤝 NGO Dashboard + Collaboration System</strong></summary>

**Tabs:**
- **Overview** — KPI cards, verification status, quick actions
- **My Tutors** — empanelled tutor pool (add/remove)
- **Requests** — sent collaboration requests with status filter
- **Assignments** — active group assignments

**Full Collaboration Flow:**
1. NGO browses tutors → clicks "Add to My Tutors" (empanels)
2. From pool, NGO sends "Collaboration Request" (grade, subjects, message)
3. Tutor sees request in NGO Partners tab → Accepts / Declines
4. On acceptance → NGO and Tutor exchange contact info
5. NGO creates Assignment (grade, student count, internal notes)
6. Tutor sees assignment in their dashboard (no student PII exposed)
7. NGO can end assignment → clears `assignedTutor` on all beneficiaries

**Privacy gates enforced:**
- Tutors NEVER see beneficiary names, phones, or emails
- Aadhaar never returned to non-admin endpoints
- NGO contact only shared post-acceptance

</details>

<details>
<summary><strong>🛡️ Admin Panel</strong></summary>

- Platform overview stats (total users, pending verifications, verified count)
- Verification queue — filter by role and status
- Review submitted documents (degree, school ID, NGO registration, Aadhaar)
- Approve → marks user verified, syncs TutorProfile
- Reject → saves note shown to user in their dashboard

</details>

---

## 🛠️ Tech Stack Deep Dive

### Frontend
| Technology | Version | Why |
|-----------|---------|-----|
| React | 18 | Component model, hooks, context |
| Vite | 5 | Fast HMR, `@tailwindcss/vite` plugin |
| TailwindCSS | 4 (via Vite plugin) | Utility-first, custom animations in `index.css` |
| React Router | 6 | Nested routes, protected route wrappers |
| Axios | latest | Credentials: true, interceptors, timeout |
| Lucide React | 0.383.0 | Consistent icon system |
| Plus Jakarta Sans | Google Fonts | Brand typography |

> ⚠️ **Critical**: This project uses `@tailwindcss/vite` plugin — NOT PostCSS. `index.css` uses `@import "tailwindcss"`. Do NOT add `tailwind.config.js` or `@tailwind` directives.

### Backend
| Technology | Version | Why |
|-----------|---------|-----|
| Node.js | 18+ | Runtime |
| Express | 4 | REST API, middleware chain |
| CommonJS | — | All server files use `require()` / `module.exports` |
| Mongoose | 7+ | ODM, schema validation, pre-save hooks |
| Passport.js | — | Local + Google OAuth2 strategies |
| JWT | jsonwebtoken | Stateless auth, HttpOnly cookie transport |
| bcryptjs | — | Password hashing, 12 salt rounds |
| Multer + multer-storage-cloudinary | — | File upload pipeline |
| Cloudinary | — | Document/image cloud storage |
| cookie-parser | — | Read HttpOnly JWT cookies |
| cors | — | `credentials: true`, origin whitelist |
| dotenv | — | Environment variable loading |

### Database
| Feature | Implementation |
|---------|---------------|
| ODM | Mongoose with strict schema validation |
| Geospatial | `2dsphere` index on `TutorProfile.geoLocation` |
| Text Search | Compound text index (name, bio, subjects) |
| TTL Index | `CollabRequest.expiresAt` — sparse, auto-deletes stale pending requests |
| Privacy | `aadhaar` field: `select: false` everywhere |
| Pre-save hooks | `function(next)` pattern — NOT async arrow functions |

---

## 📁 Project Structure

```
edureach/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── PublicNavbar.jsx         # Role-aware nav
│   │   │   ├── public/
│   │   │   │   ├── BrowseTutorsPage.jsx     # Discovery + filters
│   │   │   │   └── TutorProfilePage.jsx     # Profile + booking modal
│   │   │   ├── shared/
│   │   │   │   ├── DocumentUpload.jsx       # Drag-drop upload widget
│   │   │   │   ├── ProtectedRoute.jsx       # Route guard wrappers
│   │   │   │   ├── SessionBanner.jsx        # OAuth/session error banner
│   │   │   │   └── VerificationStatusRow.jsx
│   │   │   ├── student/
│   │   │   │   └── StudentDashboard.jsx
│   │   │   ├── tutor/
│   │   │   │   ├── TutorDashboard.jsx
│   │   │   │   └── EditProfileModal.jsx
│   │   │   └── ngo/
│   │   │       ├── NgoDashboard.jsx
│   │   │       └── CollabComponents.jsx     # Modals + tabs extracted
│   │   ├── context/
│   │   │   └── AuthContext.jsx              # Global auth state + polling
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── OnboardingPage.jsx       # 5-step wizard
│   │   │   │   └── OAuthCallback.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       └── VerificationQueue.jsx
│   │   ├── hooks/
│   │   │   ├── useBroadcastAuth.js          # Cross-tab sync
│   │   │   └── useTutors.js
│   │   ├── router/
│   │   │   └── index.jsx                    # All routes defined here
│   │   ├── services/
│   │   │   ├── api.js                       # Axios instance
│   │   │   ├── tutorService.js              # tutor + session + ngo API calls
│   │   │   ├── adminService.js
│   │   │   └── uploadService.js
│   │   ├── index.css                        # Tailwind + custom animations
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js                       # @tailwindcss/vite plugin
│
└── server/                          # Express backend
    ├── config/
    │   ├── db.js                            # MongoDB connection
    │   ├── passport.js                      # Local + Google strategies
    │   └── cloudinary.js                    # Cloudinary SDK init
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── tutor.controller.js              # CRUD + createTutorProfile helper
    │   ├── session.controller.js            # Full session lifecycle
    │   ├── ngo.controller.js                # Beneficiaries + empanelment + collab
    │   ├── collab.controller.js             # Tutor-side collab actions
    │   ├── upload.controller.js             # Cloudinary upload + doc retrieval
    │   └── admin.controller.js              # Verification queue
    ├── middleware/
    │   ├── auth.middleware.js               # protect + requireRole
    │   └── upload.middleware.js             # multer + Cloudinary storage
    ├── models/
    │   ├── User.model.js                    # Master user model (all roles)
    │   ├── TutorProfile.model.js            # Extended tutor public profile
    │   ├── Session.model.js                 # Session lifecycle + NGO extensions
    │   ├── Empanelment.model.js             # NGO ↔ Tutor trust relationship
    │   ├── CollabRequest.model.js           # NGO → Tutor collaboration request
    │   └── Assignment.model.js              # Group teaching assignment
    ├── routes/
    │   ├── auth.routes.js
    │   ├── tutor.routes.js
    │   ├── session.routes.js
    │   ├── ngo.routes.js
    │   ├── upload.routes.js
    │   └── admin.routes.js
    ├── scripts/
    │   └── seed.js                          # Seed 3 test tutors
    ├── utils/
    │   └── jwt.utils.js                     # Token generation + cookie sender
    └── app.js                               # Express entry point
```

---

## 🚀 Complete Setup Guide

### Prerequisites

Make sure you have the following installed:

```bash
node --version   # v18.0.0 or higher
npm --version    # v9.0.0 or higher
```

You also need accounts on:
- **MongoDB Atlas** — [mongodb.com/atlas](https://www.mongodb.com/atlas) (free tier works)
- **Google Cloud Console** — [console.cloud.google.com](https://console.cloud.google.com) (for OAuth)
- **Cloudinary** — [cloudinary.com](https://cloudinary.com) (free tier works)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/<your-username>/edureach.git
cd edureach
```

---

### Step 2 — Install Dependencies

This project has **two separate `package.json` files** — one for the client, one for the server. Install both.

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

**Server packages installed:**
`express` `mongoose` `passport` `passport-local` `passport-google-oauth20` `jsonwebtoken` `bcryptjs` `cookie-parser` `cors` `dotenv` `multer` `multer-storage-cloudinary` `cloudinary`

**Client packages installed:**
`react` `react-dom` `react-router-dom` `axios` `lucide-react` `@tailwindcss/vite` `vite` `@vitejs/plugin-react`

---

### Step 3 — Set Up MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. Click **Connect** → **Connect your application**
3. Copy the connection string — it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```
4. Replace `<username>`, `<password>`, and `<dbname>` with your values
5. In **Network Access**, add `0.0.0.0/0` (allow all IPs) for development

---

### Step 4 — Set Up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client IDs**
4. Application type: **Web application**
5. Add Authorized redirect URIs:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
6. Copy your **Client ID** and **Client Secret**

---

### Step 5 — Set Up Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → Sign up free
2. From your Dashboard, copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## 🔐 Environment Variables

### Server `.env` file

Create a file at `server/.env`:

```env
# ─── Server ──────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── MongoDB ─────────────────────────────────────────────────
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/edureach?retryWrites=true&w=majority

# ─── JWT ─────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRE=7d

# ─── Google OAuth ────────────────────────────────────────────
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# ─── Cloudinary ──────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Client URL (for CORS + OAuth redirect) ──────────────────
CLIENT_URL=http://localhost:5173

# ─── Dev Gate (set to "true" to show unverified tutors) ──────
SKIP_VERIFICATION_GATE=true
```

> 💡 **`SKIP_VERIFICATION_GATE=true`** is important during development. Without it, newly seeded tutors won't appear on the browse page because they won't be admin-verified yet.

### Client `.env` file

Create a file at `client/.env`:

```env
# ─── API Base URL ─────────────────────────────────────────────
VITE_API_URL=http://localhost:5000/api
```

---

## ▶️ Running the Project

### Option A — Run Both Servers Separately (Recommended)

**Terminal 1 — Start the backend:**
```bash
cd server
node app.js
```

You should see:
```
MongoDB connected: cluster0.xxxxx.mongodb.net
🚀 EduReach server at http://localhost:5000
   Health: http://localhost:5000/api/health
```

**Terminal 2 — Start the frontend:**
```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

### Option B — Run with Nodemon (Auto-restart on server changes)

```bash
# Install nodemon globally (one-time)
npm install -g nodemon

# Then run server with:
cd server
nodemon app.js
```

---

### Step 6 — Seed the Database (Optional but Recommended)

Seed 3 verified test tutors into the database:

```bash
cd server
node scripts/seed.js
```

Expected output:
```
✅ MongoDB connected
🧹 Database cleaned
✓ Seeded: Priya Sharma
✓ Seeded: Rahul Desai
✓ Seeded: Sneha Patel
🎉 Seeding completed successfully!
Login: any email | Password: Test@1234
```

---

### Step 7 — Create an Admin Account

There is no UI for creating an admin. Do it directly in MongoDB:

1. Register normally at `http://localhost:5173/register`
2. Open MongoDB Atlas → Browse Collections → `users`
3. Find your user document → Edit → change `role` to `"admin"`
4. Also set `"isProfileComplete": true`
5. Log out and log back in → you'll see the admin panel at `/admin/dashboard`

---

### Verify Everything is Working

| Check | URL | Expected |
|-------|-----|----------|
| Server health | `http://localhost:5000/api/health` | `{"status":"EduReach server is running"}` |
| Browse tutors | `http://localhost:5173/browse` | Tutor cards visible |
| Login | `http://localhost:5173/login` | Login form loads |
| Register | `http://localhost:5173/register` | Registration form loads |

---

## 🗺️ All User Flows Explained

### 🎓 Student Flow
```
Register → Onboarding (role + phone + subjects + school ID upload + location)
→ Browse Tutors → Filter by subject/area → View Tutor Profile
→ Book Trial (5-step modal) → Wait for tutor to accept
→ Dashboard: Join Class (5min before start) → Complete → Leave Review
```

### 📚 Tutor Flow
```
Register → Onboarding (role + credentials + degree upload + aadhaar + location)
→ Tutor Dashboard: See incoming requests → Accept/Decline
→ Add meeting link → Student joins → Mark session Done
→ Edit Profile modal: update bio, rate, subjects, availability
→ NGO Partners tab: respond to collaboration requests
```

### 🤝 NGO Flow
```
Register → Onboarding (NGO role + org name + registration proof upload + location)
→ Browse Tutors → "Add to My Tutors" (empanel)
→ NGO Dashboard → My Tutors tab → Send Collaboration Request
→ Tutor accepts → Contact info revealed
→ Create Assignment (grade, student count) → Track in Assignments tab
```

### 🛡️ Admin Flow
```
Login (admin role set in DB) → Admin Panel
→ Verifications tab → Review submitted documents
→ View degree / Aadhaar / school ID / registration proof
→ Approve (tutor becomes verified, appears in marketplace) or Reject with note
```

---

## 📡 API Reference

### Auth Routes — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Create account |
| POST | `/login` | Public | Email/password login |
| GET | `/google` | Public | Google OAuth redirect |
| GET | `/google/callback` | Public | OAuth callback |
| POST | `/onboarding` | 🔒 | Complete profile setup |
| GET | `/me` | 🔒 | Get current user |
| PATCH | `/role` | 🔒 | Update role (mid-onboarding) |
| POST | `/logout` | 🔒 | Clear cookie, logout |

### Tutor Routes — `/api/tutors`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List/search tutors |
| GET | `/nearby` | Public | Geospatial nearby search |
| GET | `/:id` | Public | Single tutor full profile |
| GET | `/me/profile` | 🔒 Tutor | Get own tutor profile |
| PATCH | `/me/profile` | 🔒 Tutor | Update profile/availability |
| GET | `/ngo-requests` | 🔒 Tutor | Incoming NGO requests |
| PATCH | `/ngo-requests/:id/respond` | 🔒 Tutor | Accept/decline request |
| GET | `/assignments` | 🔒 Tutor | Active group assignments |

### Session Routes — `/api/sessions`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/request` | 🔒 Student | Book a session |
| GET | `/student` | 🔒 Student | My sessions |
| GET | `/tutor` | 🔒 Tutor | Incoming sessions |
| PATCH | `/:id/respond` | 🔒 Tutor | Accept/reject |
| PATCH | `/:id/link` | 🔒 Tutor | Add meeting link |
| PATCH | `/:id/reschedule` | 🔒 Tutor | Reschedule with note |
| POST | `/:id/join` | 🔒 Both | Record join timestamp |
| PATCH | `/:id/complete` | 🔒 Tutor | Mark done |
| POST | `/:id/review` | 🔒 Student | Submit review |
| PATCH | `/:id/cancel` | 🔒 Both | Cancel session |

### NGO Routes — `/api/ngo`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/beneficiary` | 🔒 NGO | Create beneficiary student |
| GET | `/beneficiaries` | 🔒 NGO | List beneficiaries (paginated) |
| GET | `/stats` | 🔒 NGO | Dashboard KPIs |
| GET | `/sessions` | 🔒 NGO | Session feed |
| GET | `/export` | 🔒 NGO | CSV export |
| POST | `/empanel/:id` | 🔒 NGO | Add tutor to pool |
| GET | `/empanelled-tutors` | 🔒 NGO | Get tutor pool |
| DELETE | `/empanel/:id` | 🔒 NGO | Remove from pool |
| POST | `/collab-request` | 🔒 NGO | Send collaboration request |
| GET | `/collab-requests` | 🔒 NGO | List sent requests |
| DELETE | `/collab-request/:id` | 🔒 NGO | Cancel pending request |
| POST | `/assignment` | 🔒 NGO | Create group assignment |
| GET | `/assignments` | 🔒 NGO | List assignments |
| PATCH | `/assignment/:id/end` | 🔒 NGO | End assignment |

### Upload Routes — `/api/upload`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/document?documentType=X` | 🔒 | Upload file to Cloudinary |
| GET | `/my-documents` | 🔒 | Get own documents (no Aadhaar) |

### Admin Routes — `/api/admin`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | 🔒 Admin | Platform overview stats |
| GET | `/verifications` | 🔒 Admin | Verification queue |
| PATCH | `/verify/:userId` | 🔒 Admin | Approve or reject user |

---

## 🧠 Key Engineering Decisions

### 1. `@tailwindcss/vite` Plugin — Not PostCSS
We use Tailwind v4's Vite plugin. `index.css` starts with `@import "tailwindcss"`. If you add a `tailwind.config.js` or PostCSS config, it will conflict and break styles. This is intentional and locked.

### 2. CommonJS Throughout the Server
All server files use `require()` / `module.exports`. Do not introduce ES module syntax (`import/export`) on the server side.

### 3. `function(next)` in Mongoose Pre-save Hooks
```js
// ✅ Correct — what we use
SessionSchema.pre('save', async function () { ... });

// ❌ Wrong — caused silent crashes (next is not a function)
SessionSchema.pre('save', async (next) => { next(); });
```
Arrow functions don't bind `this`, making the hook unable to access the document. We also learned that `next` must not be called manually if the function is async.

### 4. Trial Uniqueness Is Per-Tutor, Not Global
A student can book free trials with **multiple different tutors**. Only same-tutor duplicate trials are blocked. This was a common mistake in early implementations.

### 5. Aadhaar Field: `select: false`
```js
aadhaar: { type: String, default: null, select: false }
```
This field is **never** returned by any user-facing query. Admin controllers explicitly select it when needed. This is a hard privacy guarantee in the schema.

### 6. `SKIP_VERIFICATION_GATE` Env Flag
For development, set this to `true` in `server/.env`. It bypasses the marketplace filter that hides unverified tutors. Without it, newly seeded tutors won't appear until admin-approved.

### 7. BroadcastChannel for Cross-Tab Auth Sync
```js
// One tab logs out → sends 'LOGOUT' event
channel.postMessage({ type: 'LOGOUT', source: TAB_ID });

// All other tabs receive it and navigate to /login
```
Each tab has a unique `TAB_ID` to prevent reacting to its own broadcasts.

### 8. Sparse TTL Index on CollabRequest
```js
CollabRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
```
Pending requests auto-expire after 14 days. Setting `expiresAt = null` on accepted/declined records exempts them from TTL deletion, preserving audit history.

---

## 🐛 Bugs Fixed & Lessons Learned

| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| Meeting link save crashed server | `async` pre-save hook used arrow function — `next` was undefined | Changed to `async function()` without calling `next` |
| Reschedule endpoint threw 500 | Same pre-save hook issue triggered on `save()` | Same fix — `function(next)` pattern |
| Tutors could book trials globally blocked | Trial uniqueness check was global, not per-tutor | Added `tutorProfile` to the uniqueness query |
| Fake stats showed on new tutor profiles | Seed script hardcoded fake ratings | Removed all fake data from seed script |
| Edit profile modal crashed for new tutors | `profile` object was null — modal had no fallback | Added null-safe defaults throughout modal |
| White screen on duplicate trial booking | 409 error was unhandled in frontend | Added graceful error with readable message |
| "Join Class" button never activated | Time check compared wrong timezone | Fixed: compare `new Date(session.scheduledAt)` fresh each interval |
| NGO stats showed 0 always | `activeTutors` KPI queried wrong collection | Fixed aggregation pipeline to use correct model |
| Admin couldn't see Aadhaar | `select: false` blocked even admin queries | Admin controller explicitly uses `.select('+documents.aadhaar')` |
| Cross-tab logout didn't work | BroadcastChannel reacted to its own events | Added `TAB_ID` source filtering |

---

## 👥 Team

<div align="center">

| Role | Name |
|------|------|
| 🏗️ Lead Developer & Product | **Tanmay** |
| 👨‍💻 Developer | **Dhanesh** |
| 👨‍💻 Developer | **Harsh** |
| 👨‍💻 Developer | **Ritesh** |
| 🎓 Faculty Advisor | **Prof. Shiv Negi** |

**Institution:** Don Bosco Institute of Technology (DBIT), Mumbai
**SDG Alignment:** SDG 4 — Quality Education

</div>

---

## 📚 What We Learned

```
🔐 Auth is never "done" — session management, cross-tab sync,
   OAuth callback flows, cookie security — each layer adds complexity.

🏗️ Schema design decisions haunt you — the aadhaar select:false
   decision saved us from a privacy incident in testing.

🐛 Mongoose pre-save hooks are tricky — arrow functions break `this`
   binding. Async hooks must not manually call next(). We learned this
   the hard way after mysterious 500 errors on meeting link saves.

🧩 Role-aware UX matters — tutors seeing "Book Trial" CTAs on browse
   felt wrong. Small UX gates (role-aware nav links, different CTAs)
   make the platform feel professional.

📊 Compound indexes are critical — without the right indexes, MongoDB
   geospatial queries and text searches were unusably slow in dev.

🤝 NGO workflows need their own mental model — the empanelment →
   request → assignment pipeline was the most complex feature we built.
   Decomposing it into three separate models was the right call.
```

---

<div align="center">

<!-- Footer Wave -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=120&section=footer&animation=twinkling" width="100%"/>

**Built with ❤️ for SDG 4 — Quality Education**

*EduReach © 2025 — DBIT Mumbai*

</div>
