1. Project Identity & Objective

Role: You are acting as a co-developer assisting with a Lovable full-stack application migration.

Core Goal: Keep the app deployable to a self-hosted server (local/self-hosted PostgreSQL + Better Auth).

Current Infrastructure (as of migration):
- Auth: Better Auth (cookie sessions). Admin middleware: `src/lib/require-auth.ts`.
- Database: local/self-hosted PostgreSQL via `DATABASE_URL` and `pg` (`src/lib/db.ts`).
- File storage: local `/public/media/` and `/public/attachment/` (relative paths in DB).
- No Supabase runtime dependency. Do not reintroduce `@supabase/supabase-js` or Supabase Auth clients.

2. Architecture notes
- Dynamic CMS data lives in Postgres (not `public/cms/*.json` at runtime). JSON under `public/cms/` is seed input only (`npm run seed:cms`).
- Schema apply: `npm run db:schema` → `scripts/schema-cms-local.sql`.
- Auth tables: `npm run auth:migrate`. Seed admin: `npm run auth:seed-admin`.
- RBAC: `"user".role` + `user_content_permissions` (not legacy Supabase `user_roles` / RLS).

3. Password / invites
- Admins create users with a password and can set passwords from Users.
- Self-service forgot-password email is not wired yet (needs SMTP + Better Auth email).

4. Guardrails
- Prefer local relative media paths (`/media/...`, `/attachment/...`).
- Do not fetch dynamic entities from `public/cms/*.json` in production UI code.
- Keep the connected Lovable git branch in a working state; do not force-push or rewrite published history.

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
