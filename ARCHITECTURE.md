# MahaTest Government Exam Mock Test Platform Architecture

## Vision

Build the fastest, most scalable online government exam preparation platform.

The platform should provide a premium exam experience with minimal latency, excellent SEO, and enterprise-grade architecture while remaining affordable to operate.

---

# Product Goal

Create a platform similar to Testbook and Oliveboard focused on government examinations.

Examples:

- SSC
- Banking
- Railway
- UPSC
- MPSC
- DSSSB
- Teaching
- Police
- State PSC
- CET

---

# Core Principles

- Performance First
- Simplicity
- Scalability
- Security
- Offline Support
- Modular Architecture
- Type Safety
- Clean Code
- Reusable Components

---

# Technology Stack

## Next.js

Used for:

- Website
- Landing Pages
- Student Dashboard
- Admin Dashboard
- SEO
- Blogs
- Current Affairs

Reason:

- Server Rendering
- Excellent SEO
- Fast Performance
- App Router
- Modern React

---

## Fastify

Used for:

- REST APIs
- Authentication
- Admin APIs
- Student APIs
- WebSocket Gateway

Reason:

- High Performance
- Low Memory Usage
- TypeScript Friendly

---

## MongoDB

Permanent storage for:

- Users
- Exams
- Questions
- Question Banks
- Results
- Blogs
- Current Affairs
- Notifications
- Settings

---

## Redis

Temporary storage for:

- Live Exam State
- Sessions
- Leaderboards
- Cached Data
- Dashboard Statistics

Redis is NEVER used as permanent storage.

---

## NATS JetStream

Used for asynchronous processing:

- Exam Submission
- Result Generation
- Email Jobs
- Analytics Jobs
- Background Tasks

---

## IndexedDB

Runs inside the student's browser.

Stores:

- Downloaded Exam
- Answers
- Timer State
- Review List
- Pending Sync Queue

Purpose:

- Offline Protection
- Instant Autosave
- Reduced API Calls

---

## WebSocket

Used for:

- Live Answer Sync
- Heartbeat
- Reconnection
- Exam Presence

---

## Cloudflare R2

Stores:

- Images
- PDFs
- Certificates
- Blog Images

---

## Resend

Used for:

- Welcome Email
- Password Reset
- OTP
- Notifications

---

# Performance Rules

- Native System Fonts Only
- No Google Fonts
- No External Icon Fonts
- SVG Icons Only
- Lazy Loading
- Dynamic Imports
- Code Splitting
- Image Optimization
- Minimal Dependencies
- Mobile First

---

# Exam Workflow

Student

↓

Downloads Exam JSON

↓

Stores Exam in IndexedDB

↓

Answers Questions

↓

Save instantly to IndexedDB

↓

Background WebSocket Sync

↓

Redis

↓

Submit Exam

↓

NATS JetStream

↓

Evaluation Worker

↓

MongoDB

↓

Results

---

# User Roles

## Super Admin

- Platform Management
- Users
- Content
- Analytics
- Settings

## Content Manager

- Question Bank
- Exams
- Test Series
- Blogs
- Current Affairs

## Student

- Attempt Exams
- Practice
- Results
- Analytics
- Bookmarks

---

# Development Rules

- TypeScript Only
- No JavaScript Files (tooling configs like ESLint/PostCSS may use `.js` / `.mjs` where required by the toolchain)
- No `any` Types
- Zod Validation
- Reusable Components
- Feature-Based Architecture
- Clean Folder Structure
- Proper Error Handling
- Proper Logging
- Responsive Design

---

# Monorepo Layout

```text
apps/web          Next.js 15 App Router (website, student/admin dashboards, SEO)
apps/api          Fastify REST + WebSocket gateway
packages/typescript-config
packages/eslint-config
packages/tailwind-config
docker/           Local MongoDB + Redis (docker compose) and future deployment artifacts
```

Package manager: **pnpm** workspaces  
Build orchestration: **Turborepo**

---

# Authentication

## Flow

- Register / Login issue a short-lived **JWT access token** (Bearer) and an httpOnly **refresh token cookie**
- Refresh tokens are stored in **Redis** (revocable) and rotated on each `/auth/refresh`
- The Next.js app proxies `/backend/*` → API so auth cookies are same-origin in local development
- **Redis is required** — the API will not start without it
- Passwords are hashed with **bcrypt** (cost 12)
- Email verification + password reset use opaque tokens (SHA-256 hashed at rest)
- Email delivery via **Resend**; without `RESEND_API_KEY`, messages are logged in development

## API Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Refresh cookie |
| POST | `/auth/logout` | Access JWT |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |
| POST | `/auth/verify-email` | Public |
| POST | `/auth/resend-verification` | Access JWT |
| GET | `/auth/me` | Access JWT |
| PATCH | `/auth/me` | Access JWT |

## Web Routes

- `/register`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email`, `/profile`

---

# Question Bank

Hierarchy: **Category → Subject → Chapter → Topic → Question**

## Access

- `content_manager` and `super_admin` only
- Promote a user: `pnpm --filter @mahatest/api promote -- you@email.com content_manager`

## Storage

- Taxonomy + questions in **MongoDB**
- Question images stored under `UPLOAD_DIR` and served at `/uploads/*` (R2 later)
- Stem + explanation are HTML (TipTap rich text on web)

## API (prefix `/question-bank`)

| Resource | Endpoints |
|----------|-----------|
| Categories / Subjects / Chapters / Topics | CRUD list/create/patch/delete |
| Questions | list, get, create, patch, delete |
| Bulk import | `POST /questions/bulk-import` |
| Uploads | `POST /uploads` (multipart image) |

## Admin UI

- `/admin/question-bank` — overview
- `/admin/question-bank/taxonomy`
- `/admin/question-bank/questions` (+ new/edit)
- `/admin/question-bank/import`

---

# Mock Test Engine

Follows the architecture workflow:

**Download package → IndexedDB → answer + autosave → WebSocket sync → Redis live state → submit → NATS JetStream → evaluation worker → MongoDB results**

## Exam types

- `mock`
- `test_series`
- `previous_year`
- `daily_quiz`

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST/PATCH/DELETE | `/exams` | Exam catalog (staff write, students read published) |
| GET/POST/PATCH/DELETE | `/test-series` | Test series |
| POST | `/exams/:id/attempts` | Start / resume attempt + package |
| GET | `/attempts/:id/package` | Download exam JSON (no correct answers) |
| POST | `/attempts/:id/sync` | HTTP answer sync (IndexedDB backup) |
| WS | `/exams/ws?token=` | Live answer sync |
| POST | `/attempts/:id/submit` | Submit → NATS (or inline evaluate if NATS down) |
| GET | `/attempts/:id/result` | Detailed result + explanations |
| GET | `/attempts/mine` | Student attempt history |

## Client

- `/exams` — student catalog + continue
- `/exams/attempts/:attemptId` — full exam player (timer, palette, mark for review)
- `/exams/attempts/:attemptId/result`
- `/admin/exams` — create/publish exams from published questions

## Infra

- Redis: `exam:live:{attemptId}`
- NATS JetStream stream `EXAMS` / subject `exams.submit`
- If NATS is offline, evaluation runs inline so local development still works

---

# Student Dashboard

Authenticated student area under `/dashboard` with sidebar navigation.

## Pages

| Route | Purpose |
|-------|---------|
| `/dashboard` | Home — summary, continue exams, recent results, recommended |
| `/dashboard/tests` | My Tests — attempts + start catalog |
| `/dashboard/results` | Results hub |
| `/dashboard/analytics` | Accuracy / type breakdown / score trend |
| `/dashboard/leaderboards` | Global or per-exam ranks (Redis-cached) |
| `/dashboard/bookmarks` | Saved questions |
| `/dashboard/practice` | Topic drills with instant evaluation |

## API (prefix `/student`)

| Method | Path |
|--------|------|
| GET | `/student/home` |
| GET | `/student/analytics` |
| GET | `/student/leaderboards` |
| GET/POST/DELETE | `/student/bookmarks` |
| GET | `/student/practice/topics` |
| POST | `/student/practice/sessions` |
| POST | `/student/practice/sessions/:id/submit` |

---

# Admin Dashboard

Staff area under `/admin` for `content_manager` and `super_admin`.

## Pages

| Route | Purpose | Roles |
|-------|---------|-------|
| `/admin` | Platform overview (Redis-cached stats) | staff |
| `/admin/users` | List users / assign roles | super_admin |
| `/admin/question-bank/*` | Taxonomy, questions, import | staff |
| `/admin/exams` | Create/publish exams | staff |
| `/admin/test-series` | Package exams into series | staff |
| `/admin/categories` | Category shortcuts | staff |
| `/admin/blogs` | Blog CMS | staff |
| `/admin/current-affairs` | Current affairs CMS | staff |
| `/admin/notifications` | Draft/send announcements | staff |
| `/admin/reports` | Attempts, scores, top exams | staff |
| `/admin/settings` | Platform settings | super_admin |

## API (prefix `/admin`)

| Method | Path | Roles |
|--------|------|-------|
| GET | `/admin/dashboard` | staff |
| GET | `/admin/reports` | staff |
| GET/PATCH | `/admin/users`, `/admin/users/:id` | super_admin |
| CRUD | `/admin/blogs` | staff |
| CRUD | `/admin/current-affairs` | staff |
| CRUD | `/admin/notifications` | staff |
| GET/PATCH | `/admin/settings` | super_admin |

---

# Public Website

Marketing and content site for aspirants (SEO + conversion).

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing — brand-first full-bleed hero |
| `/exam-prep` | Exam track hub |
| `/exam-prep/[slug]` | SSC, Banking, Railway, UPSC, State PSC |
| `/blog`, `/blog/[slug]` | Published blog posts |
| `/current-affairs`, `/current-affairs/[slug]` | Published current affairs |
| `/about` | About MahaTest |
| `/contact` | Contact form |
| `/faq` | FAQ |
| `/privacy` | Privacy Policy |
| `/terms` | Terms & Conditions |

Authenticated mock catalog remains at `/exams`.

## API (prefix `/public`)

| Method | Path |
|--------|------|
| GET | `/public/blogs`, `/public/blogs/:slug` |
| GET | `/public/current-affairs`, `/public/current-affairs/:slug` |
| GET | `/public/settings` |
| POST | `/public/contact` |

---

# Future Features

- Premium Plans
- Razorpay
- SMS
- AI Question Generation
- AI Study Plans
- Rank Prediction
- Push Notifications
- OpenSearch
- Microservices (if needed)

---

This document is the single source of truth for the project. Every implementation must follow the architecture and principles defined here.
