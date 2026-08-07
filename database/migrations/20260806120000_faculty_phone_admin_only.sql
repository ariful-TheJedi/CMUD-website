-- Faculty phone numbers are for admin/staff use only.
-- Public APIs must not select or return this column.
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
