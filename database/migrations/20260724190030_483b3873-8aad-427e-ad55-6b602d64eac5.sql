
DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '';

UPDATE public.courses
   SET status = (CASE WHEN is_published THEN 'published' ELSE 'draft' END)::public.content_status
 WHERE status = 'draft'::public.content_status AND is_published = true;

CREATE OR REPLACE FUNCTION public.sync_course_publish_flag()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.is_published := (NEW.status = 'published'::public.content_status);
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.sync_course_publish_flag() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.protect_course_publish()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'administrator'::public.app_role) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'draft'::public.content_status;
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.protect_course_publish() FROM PUBLIC;

DROP TRIGGER IF EXISTS a_protect_course_publish ON public.courses;
CREATE TRIGGER a_protect_course_publish
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.protect_course_publish();

DROP TRIGGER IF EXISTS z_sync_course_publish_flag ON public.courses;
CREATE TRIGGER z_sync_course_publish_flag
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.sync_course_publish_flag();

ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS specialty text NOT NULL DEFAULT '';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS short_bio text NOT NULL DEFAULT '';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS full_bio text NOT NULL DEFAULT '';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS alt_text text NOT NULL DEFAULT '';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft';

UPDATE public.faculty
   SET full_bio  = CASE WHEN full_bio  = '' THEN bio ELSE full_bio END,
       short_bio = CASE WHEN short_bio = '' THEN LEFT(bio, 240) ELSE short_bio END,
       status    = (CASE WHEN is_published THEN 'published' ELSE 'draft' END)::public.content_status
 WHERE (status = 'draft'::public.content_status AND is_published = true)
    OR full_bio = ''
    OR short_bio = '';

CREATE OR REPLACE FUNCTION public.sync_faculty_publish_flag()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.is_published := (NEW.status = 'published'::public.content_status);
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.sync_faculty_publish_flag() FROM PUBLIC;

DROP TRIGGER IF EXISTS z_sync_faculty_publish_flag ON public.faculty;
CREATE TRIGGER z_sync_faculty_publish_flag
  BEFORE INSERT OR UPDATE ON public.faculty
  FOR EACH ROW EXECUTE FUNCTION public.sync_faculty_publish_flag();
