# Courses CMS Module

Build the first CMS module so admins/editors can manage courses from the admin dashboard, and the public homepage + `/courses` + `/courses/:slug` read from the database (with the existing `src/data/courses.ts` as fallback if the table is empty).

## 1. Database

Create `public.courses` mirroring the existing `Course` type:

Columns:
- `slug` (text, unique) — URL key
- `name`, `category`, `duration`, `mode`, `eligibility` (text)
- `short_description`, `description` (text)
- `fee`, `discount_fee` (integer)
- `syllabus`, `outcomes` (text[])
- `featured` (bool, default false)
- `is_published` (bool, default true)
- `sort_order` (int, default 0)
- standard `id`, `created_at`, `updated_at`

Access rules (in plain terms):
- Anyone (public visitors) can read **published** courses.
- Signed-in admins and `content_editor` role can read all courses.
- Only admins and `content_editor` can insert / update / delete.

Grants + RLS + `updated_at` trigger in the same migration.

Seed the table with the 17 existing courses from `src/data/courses.ts` (via the insert tool, after the migration).

## 2. Server functions

`src/lib/courses.functions.ts`:
- `listPublicCourses()` — public, server publishable client, only published rows, ordered by `sort_order, name`.
- `getPublicCourseBySlug(slug)` — public, single published row.
- `listAllCoursesAdmin()` — `requireSupabaseAuth` + role check (admin OR content_editor), returns all rows.
- `upsertCourseAdmin(course)` — same guard, insert or update.
- `deleteCourseAdmin(id)` — same guard.

Role check reuses `has_role` RPC.

## 3. Public pages

Update to read from DB, keep current design/layout untouched:
- `src/routes/index.tsx` — featured courses grid uses `listPublicCourses` via `ensureQueryData` + `useSuspenseQuery`. Fallback to static `courses` array if the query returns empty.
- `src/routes/courses.index.tsx` — same pattern, all published courses.
- `src/routes/courses.$slug.tsx` — `getPublicCourseBySlug` in loader; `notFoundComponent` for missing slug.

Course shape returned to the UI matches the existing `Course` type so `CourseCard` and detail page need no changes.

## 4. Admin Courses UI

`src/routes/_authenticated/admin/courses.tsx`:
- Table of all courses: name, category, mode, fee/discount, published, featured, actions (Edit, Delete).
- "New course" button opens a dialog with a form (react-hook-form + zod).
- Form fields cover every column above; syllabus/outcomes as textarea (one item per line).
- Reuses shadcn `Table`, `Dialog`, `Input`, `Textarea`, `Select`, `Switch`, `Button`.
- On save/delete, invalidate the admin query.

Sidebar entry for Courses already exists — just wire the page.

## Technical notes

- Mode is a plain text column (not enum) so future values are easy; UI select offers the current four options.
- Fallback logic: if `listPublicCourses` returns `[]`, the page renders the static array so the site never shows an empty state during the transition.
- No changes to auth, layout, styling, or other admin pages in this step.

## Out of scope (later modules)

Faculty, Gallery, Notices, Routines, Events, Testimonials, FAQs, Settings — each will follow the same pattern in its own step.
