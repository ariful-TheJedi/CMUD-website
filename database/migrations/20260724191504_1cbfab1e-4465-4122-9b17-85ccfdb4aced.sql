
-- =========================================================
-- Step 4: Content metadata + audit logging plumbing
-- =========================================================

-- 1. Ensure content_status enum has archived (already has draft/published/archived from Step 3).
--    No changes needed if it already exists.

-- 2. Reusable trigger to stamp authorship + publishing metadata.
--    - INSERT: created_by/updated_by := auth.uid(); if status='published' set published_at/by; if 'archived' set archived_at/by.
--    - UPDATE: created_by is preserved from OLD; updated_by := auth.uid();
--              status transitions set/clear published_at/by and archived_at/by.
--    Works on any table that has these columns (skips columns that don't exist).
CREATE OR REPLACE FUNCTION public.stamp_content_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  has_status boolean;
BEGIN
  -- Discover whether this table has a status column.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=TG_TABLE_NAME AND column_name='status'
  ) INTO has_status;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := uid;
    NEW.updated_by := uid;
    IF has_status THEN
      IF NEW.status = 'published'::public.content_status THEN
        NEW.published_at := now();
        NEW.published_by := uid;
      ELSIF NEW.status = 'archived'::public.content_status THEN
        NEW.archived_at := now();
        NEW.archived_by := uid;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  NEW.created_by := OLD.created_by;             -- never overwritten
  NEW.updated_by := uid;

  IF has_status THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'published'::public.content_status THEN
        NEW.published_at := now();
        NEW.published_by := uid;
        NEW.archived_at  := NULL;
        NEW.archived_by  := NULL;
      ELSIF NEW.status = 'archived'::public.content_status THEN
        NEW.archived_at := now();
        NEW.archived_by := uid;
      ELSE
        -- moved back to draft: keep published_* history? clear to reflect current state.
        NULL;
      END IF;
    ELSE
      -- Preserve stamps
      NEW.published_at := OLD.published_at;
      NEW.published_by := OLD.published_by;
      NEW.archived_at  := OLD.archived_at;
      NEW.archived_by  := OLD.archived_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Add metadata columns to each in-scope content table
--    + install stamp trigger.

DO $do$
DECLARE
  t text;
  tables_with_status text[] := ARRAY['courses','faculty','gallery_albums','notices','testimonials','faqs'];
  tables_all text[] := ARRAY['courses','faculty','gallery_albums','gallery_images','notices','testimonials','faqs'];
BEGIN
  -- Add authorship columns to every table
  FOREACH t IN ARRAY tables_all LOOP
    EXECUTE format('ALTER TABLE public.%I
      ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL', t);
  END LOOP;

  -- gallery_images lacks updated_at; add it
  EXECUTE 'ALTER TABLE public.gallery_images
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';

  -- Add publish/archive stamps to tables with status
  FOREACH t IN ARRAY tables_with_status LOOP
    EXECUTE format('ALTER TABLE public.%I
      ADD COLUMN IF NOT EXISTS published_at timestamptz,
      ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS archived_at  timestamptz,
      ADD COLUMN IF NOT EXISTS archived_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL', t);
  END LOOP;
END
$do$;

-- 4. Add `status` to tables that only have is_published (notices, testimonials, faqs, gallery_albums)
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft';
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft';
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft';
ALTER TABLE public.gallery_albums
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft';

-- 5. Backfill status from is_published (published→published, otherwise→draft)
UPDATE public.notices       SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END::public.content_status
  WHERE status = 'draft'::public.content_status;
UPDATE public.testimonials  SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END::public.content_status
  WHERE status = 'draft'::public.content_status;
UPDATE public.faqs          SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END::public.content_status
  WHERE status = 'draft'::public.content_status;
UPDATE public.gallery_albums SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END::public.content_status
  WHERE status = 'draft'::public.content_status;

-- 6. Backfill published_at for existing published rows (approximation: use updated_at/created_at); leave published_by NULL — do NOT invent identities.
UPDATE public.courses       SET published_at = COALESCE(published_at, updated_at) WHERE status='published' AND published_at IS NULL;
UPDATE public.faculty       SET published_at = COALESCE(published_at, updated_at) WHERE status='published' AND published_at IS NULL;
UPDATE public.gallery_albums SET published_at = COALESCE(published_at, updated_at) WHERE status='published' AND published_at IS NULL;
UPDATE public.notices       SET published_at = COALESCE(published_at, updated_at) WHERE status='published' AND published_at IS NULL;
UPDATE public.testimonials  SET published_at = COALESCE(published_at, updated_at) WHERE status='published' AND published_at IS NULL;
UPDATE public.faqs          SET published_at = COALESCE(published_at, updated_at) WHERE status='published' AND published_at IS NULL;

-- 7. Keep is_published in sync with status on the tables that didn't already have a sync trigger.
CREATE OR REPLACE FUNCTION public.sync_publish_flag_generic()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  NEW.is_published := (NEW.status = 'published'::public.content_status);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS z_sync_notice_publish_flag ON public.notices;
CREATE TRIGGER z_sync_notice_publish_flag BEFORE INSERT OR UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.sync_publish_flag_generic();

DROP TRIGGER IF EXISTS z_sync_testimonial_publish_flag ON public.testimonials;
CREATE TRIGGER z_sync_testimonial_publish_flag BEFORE INSERT OR UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.sync_publish_flag_generic();

DROP TRIGGER IF EXISTS z_sync_faq_publish_flag ON public.faqs;
CREATE TRIGGER z_sync_faq_publish_flag BEFORE INSERT OR UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.sync_publish_flag_generic();

DROP TRIGGER IF EXISTS z_sync_album_publish_flag ON public.gallery_albums;
CREATE TRIGGER z_sync_album_publish_flag BEFORE INSERT OR UPDATE ON public.gallery_albums
  FOR EACH ROW EXECUTE FUNCTION public.sync_publish_flag_generic();

-- 8. Install stamp_content_metadata trigger on every in-scope table.
--    Runs BEFORE INSERT/UPDATE with an "a_" name prefix so it fires before the sync triggers ("z_").
DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['courses','faculty','gallery_albums','gallery_images','notices','testimonials','faqs'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS a_stamp_content_metadata ON public.%I', t);
    EXECUTE format('CREATE TRIGGER a_stamp_content_metadata
      BEFORE INSERT OR UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.stamp_content_metadata()', t);
  END LOOP;
END $do$;

-- 9. Ensure gallery_images gets updated_at trigger
DROP TRIGGER IF EXISTS update_gallery_images_updated_at ON public.gallery_images;
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Audit log: allow any active staff (administrator OR web_manager) to insert their own entries.
--     Reading remains administrator-only.
DROP POLICY IF EXISTS "Admins insert audit logs" ON public.audit_logs;
CREATE POLICY "Staff insert own audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'administrator'::public.app_role)
      OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
    )
  );

-- No UPDATE or DELETE policy exists on audit_logs → nobody (except service_role) can edit or remove entries. Keep it that way.

-- 11. Helpful composite index for dashboard "Recent Content Updates"
CREATE INDEX IF NOT EXISTS idx_audit_logs_content ON public.audit_logs (content_type, created_at DESC);
