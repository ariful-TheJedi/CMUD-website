-- Phase 3 local CMS schema (no auth.users FKs, no RLS).
-- Applied via: npm run db:schema
-- Safe to re-run (IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE admission_status AS ENUM ('new', 'contacted', 'admitted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- faculty ----------
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  credentials TEXT NOT NULL DEFAULT '',
  specialty TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  short_bio TEXT NOT NULL DEFAULT '',
  full_bio TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NULL,
  updated_by TEXT NULL,
  published_by TEXT NULL,
  archived_by TEXT NULL,
  published_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- courses ----------
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT '',
  eligibility TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  fee INTEGER NOT NULL DEFAULT 0,
  discount_fee INTEGER NOT NULL DEFAULT 0,
  syllabus TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  outcomes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  whats_included TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  created_by TEXT NULL,
  updated_by TEXT NULL,
  published_by TEXT NULL,
  archived_by TEXT NULL,
  published_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Additive for existing DBs (CREATE TABLE IF NOT EXISTS does not add new columns)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS whats_included TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- ---------- gallery ----------
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- notices ----------
CREATE TABLE IF NOT EXISTS notice_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  notice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID NULL REFERENCES notice_categories(id) ON DELETE SET NULL,
  attachment_url TEXT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notice_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL DEFAULT '',
  file_name TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- education aides ----------
CREATE TABLE IF NOT EXISTS education_aid_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS education_aid_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES education_aid_sections(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- faqs / testimonials ----------
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NULL,
  updated_by TEXT NULL,
  published_by TEXT NULL,
  archived_by TEXT NULL,
  published_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT '';

-- ---------- page_content ----------
CREATE TABLE IF NOT EXISTS page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT,
  meta_title TEXT,
  meta_description TEXT,
  page_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- certificates ----------
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  course_name TEXT NOT NULL DEFAULT '',
  batch TEXT NOT NULL DEFAULT '',
  bmdc_number TEXT NULL,
  mobile_number TEXT NULL,
  year_of_admission TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS certificates_certificate_number_idx
  ON certificates (certificate_number);

-- ---------- admissions ----------
CREATE TABLE IF NOT EXISTS admission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  qualification TEXT NOT NULL DEFAULT '',
  medical_college TEXT NOT NULL DEFAULT '',
  bmdc_number TEXT NOT NULL DEFAULT '',
  preferred_branch TEXT NOT NULL DEFAULT '',
  course_id UUID NULL REFERENCES courses(id) ON DELETE SET NULL,
  course_slug TEXT NOT NULL DEFAULT '',
  course_name TEXT NOT NULL DEFAULT '',
  preferred_batch TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  applicant_message TEXT NULL,
  message TEXT NOT NULL DEFAULT '',
  status admission_status NOT NULL DEFAULT 'new',
  status_updated_at TIMESTAMPTZ NULL,
  status_updated_by TEXT NULL,
  reviewed_by TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist when upgrading from an older local schema
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS qualification TEXT NOT NULL DEFAULT '';
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS medical_college TEXT NOT NULL DEFAULT '';
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS bmdc_number TEXT NOT NULL DEFAULT '';
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS preferred_branch TEXT NOT NULL DEFAULT '';
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS course_slug TEXT NOT NULL DEFAULT '';
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS preferred_batch TEXT NOT NULL DEFAULT '';
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS applicant_message TEXT NULL;
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS admission_application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES admission_applications(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  created_by TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- audit_logs ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT NULL,
  action TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  content_id TEXT NULL,
  summary TEXT NULL,
  previous_value JSONB NULL,
  new_value JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional staff mirror (Better Auth `user` is source of truth for login/role)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user CMS section access (Better Auth user ids are text)
CREATE TABLE IF NOT EXISTS user_content_permissions (
  user_id TEXT NOT NULL,
  section TEXT NOT NULL,
  access TEXT NOT NULL CHECK (access IN ('none', 'view', 'update')),
  PRIMARY KEY (user_id, section)
);

-- Custom display name for staff roles (auth role stays administrator|staff)
-- Applied on Better Auth "user" table at runtime via ensureRoleLabelColumn()
-- ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role_label TEXT NOT NULL DEFAULT '';

