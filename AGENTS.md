1. Project Identity & Objective

Role: You are acting as a co-developer assisting with a Lovable full-stack application migration.

Core Goal: Keep the app deployable to a self-hosted Linux/Windows Node server (PostgreSQL + Better Auth + Nitro `node-server`).

Current Infrastructure (as of migration):
- Auth: Better Auth (cookie sessions). Admin middleware: `src/lib/require-auth.ts`.
- Env: `src/lib/env.ts` (loads `.env` if present; requires `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
- Database: local/self-hosted PostgreSQL via `DATABASE_URL` and `pg` (`src/lib/db.ts`).
- File storage: external `ASSETS_ROOT` (e.g. `cmud-assets/media/` + `cmud-assets/attachment/`). DB stores unprefixed `/media/...` and `/attachment/...`; browser uses `VITE_ASSETS_PREFIX`.
- No Supabase runtime dependency. Do not reintroduce `@supabase/supabase-js` or Supabase Auth clients.
- Zod is pinned to **4.4.3** (`package.json` + `overrides`) for Better Auth compatibility (`.meta()` API).

2. Architecture notes
- Dynamic CMS data lives in Postgres only (courses, faculty, gallery, notices, FAQs, testimonials, home `page_content`).
- Seed from `src/data/*` via `npm run seed:cms`. Do **not** fetch `public/cms/*.json` at runtime.
- Home images upload to `ASSETS_ROOT/media/home/`; content saves to Postgres (`page-content.functions.ts`).
- Schema apply: `npm run db:schema` → `scripts/schema-cms-local.sql`.
- Auth tables: `npm run auth:migrate`. First admin: set `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` in `.env`, then `npm run auth:seed-admin` (never hardcode credentials in source).
- RBAC: `"user".role` + `user_content_permissions`.

3. Build & run (self-hosted Node — not Cloudflare)
- Build: `npm run build` → Nitro preset **`node-server`** → `.output/server/index.mjs`
- Start: `npm start` (or `npm run preview`) → `scripts/start-prod.mjs` binds **HOST=0.0.0.0** / **PORT=3000** by default
- PM2: `pm2 start ecosystem.config.cjs`
- Preflight: `npm run check:env`
- Set `BETTER_AUTH_URL` to the exact browser origin (e.g. `http://192.168.0.113:3000`). Add LAN extras via `BETTER_AUTH_TRUSTED_ORIGINS`.

4. Password / invites
- Admins create users with a password and can set passwords from Users.
- Self-service forgot-password email is not wired yet (needs SMTP + Better Auth email).

5. Guardrails
- Prefer local relative media paths (`/media/...`, `/attachment/...`).
- Do not fetch dynamic entities from `public/cms/*.json` in production UI code.
- Do not switch Nitro to `cloudflare-module` / Wrangler for this self-hosted deploy path.
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
