# Government Exam Mock Test Platform named MahaTest

A production-grade, high-performance online mock test platform inspired by Testbook, Oliveboard, and Adda247.

The platform is designed specifically for government exam aspirants and focuses on:

- Fast loading
- Excellent Core Web Vitals
- Offline-safe exam engine
- High concurrency
- Scalable architecture
- SEO-first approach
- Clean and maintainable code

---

## Tech Stack

### Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React
- Zustand
- TanStack Query
- React Hook Form
- Zod
- IndexedDB

### Backend

- Node.js
- Fastify
- TypeScript
- WebSocket

### Database

- MongoDB
- Mongoose

### Cache

- Redis

### Queue

- NATS JetStream

### Storage

- Cloudflare R2

### CDN

- Cloudflare

### Email

- Resend

### Notifications

- Firebase Cloud Messaging (Future)

---

## Main Features

- User Authentication
- Question Bank
- Mock Tests
- Test Series
- Previous Year Papers
- Daily Quiz
- Current Affairs
- Blogs
- Result Analysis
- Leaderboards
- Student Dashboard
- Admin Dashboard
- Offline Exam Engine
- High Performance

---

## Project Structure

```text
apps/
  web/          Next.js 15 (App Router) — website, dashboards, SEO
  api/          Fastify — REST APIs, auth, WebSocket gateway
packages/
  typescript-config/   Shared TSConfig presets
  eslint-config/       Shared ESLint flat configs
  tailwind-config/     Shared Tailwind theme (system fonts)
docker/         Container definitions (later phase)

ARCHITECTURE.md
README.md
TODO.md
Copilot.md
GUIDE.md
```

**User guide:** see [`GUIDE.md`](./GUIDE.md) for visitors, students, content managers, and super admins.

### Commands

```bash
pnpm install          # Install dependencies
docker compose -f docker/docker-compose.yml up -d   # MongoDB + Redis
pnpm dev              # Start web (3000) + api (4000)
pnpm build            # Build all packages/apps
pnpm lint             # Lint all apps
pnpm typecheck        # Typecheck all apps
pnpm format           # Format with Prettier
```

Copy env files before first run:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The web app calls the API through a same-origin proxy at `/backend/*` (see `NEXT_PUBLIC_API_URL`), so auth cookies work in local development.

**MongoDB and Redis are both required.**

### Install Redis (Windows)

**Option A — winget (recommended)**

```bash
winget install Redis.Redis --accept-package-agreements --accept-source-agreements
```

Then start Redis (new terminal):

```bash
redis-server
```

Leave that window open. Verify:

```bash
redis-cli ping
# expect: PONG
```

**Option B — Docker** (if you install Docker Desktop later)

```bash
docker compose -f docker/docker-compose.yml up -d redis
```

**Option C — WSL2**

```bash
wsl --install   # if WSL not installed yet, then reboot
wsl sudo apt update && wsl sudo apt install -y redis-server
wsl sudo service redis-server start
wsl redis-cli ping
```

Default connection used by the API: `REDIS_URL=redis://127.0.0.1:6379` (already in `apps/api/.env`).

### Auth

API auth lives under `/auth/*` (JWT access token + httpOnly refresh cookie).  
Web pages: `/register`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email`, `/profile`.

Without `RESEND_API_KEY`, verification/reset emails are printed to the API console in development.

### Question Bank

Admin UI: `/admin/question-bank` (requires `content_manager` or `super_admin`).

```bash
# After registering, promote your account:
pnpm --filter @mahatest/api promote -- you@email.com content_manager
```

Then sign out/in and open **Admin** in the nav (`/admin`).

### Mock Test Engine

1. Publish questions in Question Bank  
2. Create an exam at `/admin/exams`  
3. Students open `/exams`, start a test (IndexedDB + timer + palette + WS sync)  
4. After submit, view `/exams/attempts/:id/result`

Optional NATS (async evaluation). Without it, evaluation runs inline:

```bash
# Docker
docker compose -f docker/docker-compose.yml up -d nats

# Or install NATS Server and run with JetStream enabled on port 4222
```

`NATS_URL` defaults to `nats://127.0.0.1:4222`.

### Student Dashboard

Signed-in students use `/dashboard` for home, my tests, continue exam, results, analytics, leaderboards, bookmarks, and practice.

### Admin Dashboard

Staff (`content_manager` / `super_admin`) use `/admin` for overview, question bank, exams, test series, categories, blogs, current affairs, notifications, and reports. Super admins also manage users and platform settings.

### Public Website

Marketing pages: `/` (landing), `/exam-prep`, `/blog`, `/current-affairs`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`. Published CMS content is served from `/public/*` APIs.

### Apps

| App | Port | Description |
|-----|------|-------------|
| `@mahatest/web` | 3000 | Next.js frontend |
| `@mahatest/api` | 4000 | Fastify API (`GET /health`) |

---

## Development Philosophy

- Performance First
- TypeScript Everywhere
- Mobile First
- SEO Optimized
- Reusable Components
- Production Ready
- Scalable Architecture

---

## Documentation

Read **ARCHITECTURE.md** before implementing any feature.

It contains:

- System Design
- Folder Structure
- Database Design
- Workflows
- Coding Standards
- Performance Rules
- Development Guidelines
- Future Roadmap
