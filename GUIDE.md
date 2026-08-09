# MahaTest User Guide

Practical guide for **visitors**, **students**, **content managers**, and **super admins**.

Open the site at **http://localhost:3000** (local) or your production URL.

---

## Roles at a glance

| Role | Who | Main areas |
|------|-----|------------|
| Visitor | Not signed in | Public website |
| Student | Default after register | Dashboard, mocks, practice |
| Content Manager | Staff | Admin content + exams |
| Super Admin | Platform owner | Everything + users + settings |

Promote a user (from project root):

```bash
pnpm --filter @mahatest/api promote -- you@email.com content_manager
# or
pnpm --filter @mahatest/api promote -- you@email.com super_admin
```

Then **sign out and sign in** so the new role applies.

---

## 1. Public website (everyone)

### Landing & navigation

| Page | URL | What it is |
|------|-----|------------|
| Home | `/` | Brand landing, exam tracks, CTAs |
| Exam prep | `/exam-prep` | SSC, Banking, Railway, UPSC, State PSC |
| Track detail | `/exam-prep/ssc` (etc.) | Track info + links to register / mocks |
| Blog | `/blog` | Published posts |
| Blog post | `/blog/[slug]` | Full article |
| Current affairs | `/current-affairs` | Dated updates |
| Affair detail | `/current-affairs/[slug]` | Full entry |
| About | `/about` | About MahaTest |
| Contact | `/contact` | Send a support message |
| FAQ | `/faq` | Common questions |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms & conditions |

**Header (signed out):** Home · Exams · Blog · Affairs · Sign in · Get started  

**Footer:** Explore + Company links (About, Contact, FAQ, Privacy, Terms)

### Contact

1. Open `/contact`
2. Fill name, email, subject, message
3. Submit — message is saved and emailed to the platform support address

Blog and current affairs only show items **published** in Admin.

---

## 2. Account (all signed-in users)

| Action | URL |
|--------|-----|
| Register | `/register` |
| Login | `/login` |
| Forgot password | `/forgot-password` |
| Reset password | `/reset-password` (from email link) |
| Verify email | `/verify-email` (from email link) |
| Profile | `/profile` |

**Tips**

- Without `RESEND_API_KEY`, verification/reset links are printed in the **API console**
- Use a real email when Resend is configured
- After promote, always re-login

---

## 3. Student guide

Students use the **Dashboard** and **Mocks**.

### Student dashboard

| Page | URL | Use it for |
|------|-----|------------|
| Home | `/dashboard` | Summary, continue exam, recent results |
| My Tests | `/dashboard/tests` | Attempts + start from catalog |
| Results | `/dashboard/results` | Past evaluated tests |
| Analytics | `/dashboard/analytics` | Accuracy, trends, breakdowns |
| Leaderboards | `/dashboard/leaderboards` | Global or per-exam ranks |
| Bookmarks | `/dashboard/bookmarks` | Saved questions |
| Practice | `/dashboard/practice` | Untimed topic drills |

**Header when signed in also shows:** Mocks · Dashboard

### Take a mock test

1. Go to **Mocks** → `/exams` (must be logged in)
2. Filter by type if needed (Mock, Test series, Previous year, Daily quiz)
3. Click **Start**
4. During the exam:
   - Timer runs at the top
   - Use the **question palette** to jump
   - **Mark for review** on unsure items
   - Answers **autosave** (IndexedDB + sync when online)
5. Click **Submit** when done
6. Open the **result** page for score, accuracy, and explanations

**Continue later:** `/dashboard` → Continue exam, or `/dashboard/tests`

### Practice (topic drills)

1. `/dashboard/practice`
2. Choose topic + question count
3. Answer and **Submit practice**
4. Review correct/incorrect + explanations
5. Optionally **Bookmark question**

### Bookmarks

- Add from practice results (or later from other flows)
- View / remove at `/dashboard/bookmarks`

---

## 4. Content Manager guide

Role: `content_manager`  

Header shows **Admin** → `/admin`

### Admin overview

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin` | Counts, recent users/exams, quick actions |
| Question Bank | `/admin/question-bank` | Overview + links |
| Taxonomy | `/admin/question-bank/taxonomy` | Category → Subject → Chapter → Topic |
| Questions | `/admin/question-bank/questions` | List / filter |
| New question | `/admin/question-bank/questions/new` | Create with rich text |
| Bulk import | `/admin/question-bank/import` | Import many questions |
| Categories | `/admin/categories` | Quick category create |
| Exams | `/admin/exams` | Create/publish exams |
| Test Series | `/admin/test-series` | Bundle exams |
| Blogs | `/admin/blogs` | Draft / publish posts |
| Current Affairs | `/admin/current-affairs` | Draft / publish updates |
| Notifications | `/admin/notifications` | Draft / send announcements |
| Reports | `/admin/reports` | Attempts, scores, top exams |

Users and Settings are **super admin only**.

### Recommended content workflow

```text
1. Categories / Taxonomy
2. Add published questions (or bulk import)
3. Create exam from published questions → publish
4. (Optional) Create test series
5. Publish blogs / current affairs for the public site
6. Send notification if needed
```

### Question Bank — step by step

1. Open **Taxonomy** (`/admin/question-bank/taxonomy`)
2. Create **Category** → **Subject** → **Chapter** → **Topic**
3. **New question** → fill stem, options, correct answers, explanation
4. Set status to **published**
5. Or use **Bulk import** for many items at once

### Create an exam

1. `/admin/exams`
2. Title, type (mock / test_series / previous_year / daily_quiz), duration
3. Select **published** questions
4. Create — students see it under `/exams` when published

### Test series

1. `/admin/test-series`
2. Title + description
3. Attach existing exams
4. Create

### Blogs & Current Affairs (public site)

1. Write content in Admin → Blog or Current Affairs  
2. Set status **Published**  
3. Visitors see them on `/blog` and `/current-affairs`

### Notifications

1. `/admin/notifications`
2. Compose title + body
3. Audience: All / Students / Staff
4. Save as draft or **Send now**

---

## 5. Super Admin guide

Role: `super_admin`  

Everything Content Managers can do, plus:

| Page | URL | Purpose |
|------|-----|---------|
| Users | `/admin/users` | Search users, change roles |
| Settings | `/admin/settings` | Site name, support email, registration, maintenance, default duration |
| Reports | `/admin/reports` | Full platform analytics |

### Manage users

1. `/admin/users`
2. Search by name/email or filter by role
3. Change role: `student` · `content_manager` · `super_admin`

**Safety rules**

- You cannot remove your own super admin role
- You cannot demote the **last** super admin

### Platform settings

1. `/admin/settings`
2. Update site name, support email (used for Contact form emails)
3. Toggle **allow registration** / **maintenance mode**
4. Set default exam duration
5. Save

---

## 6. Quick start checklists

### First-time local setup (developer)

1. Start MongoDB + Redis (required)
2. `pnpm install` then `pnpm dev`
3. Open http://localhost:3000
4. Register → promote to `super_admin` or `content_manager`
5. Re-login → open **Admin**

### First content ready for students

- [ ] Taxonomy created  
- [ ] At least one **published** question  
- [ ] At least one **published** exam  
- [ ] Student account can open `/exams` and start  

### First public content

- [ ] Publish a blog post  
- [ ] Publish a current affair  
- [ ] Confirm on `/blog` and `/current-affairs`  

---

## 7. Where to click (cheat sheet)

| I want to… | Go to |
|------------|--------|
| Browse marketing exam tracks | `/exam-prep` |
| Take a live mock | `/exams` |
| See my progress | `/dashboard` |
| Practice by topic | `/dashboard/practice` |
| Manage questions | `/admin/question-bank` |
| Publish a mock | `/admin/exams` |
| Write a blog | `/admin/blogs` |
| Change someone’s role | `/admin/users` (super admin) |
| Ask support | `/contact` |

---

## 8. Common issues

| Problem | Fix |
|---------|-----|
| Admin link missing | Account is still `student` — promote + re-login |
| Empty `/exams` | Publish exams in Admin; only published show to students |
| Empty blog / affairs | Publish from Admin (drafts stay hidden) |
| Login / dashboard errors | Ensure **Redis** and **MongoDB** are running |
| No verification email | Check API console for the link (dev without Resend) |
| Cannot start exam | Must be logged in; exam must be published with questions |

---

## 9. Related docs

- `README.md` — install, run, stack  
- `ARCHITECTURE.md` — system design & API map  
- `TODO.md` — feature roadmap  

For day-to-day use of the product, **this guide** is enough.
