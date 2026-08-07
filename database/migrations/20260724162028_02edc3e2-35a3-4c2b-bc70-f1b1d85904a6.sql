
-- ============================================================================
-- Restrict DELETE on primary CMS tables to Administrators only
-- ============================================================================

-- Courses
DROP POLICY IF EXISTS "Managers can delete courses" ON public.courses;
CREATE POLICY "Admins can delete courses" ON public.courses
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- Faculty
DROP POLICY IF EXISTS "Managers can delete faculty" ON public.faculty;
CREATE POLICY "Admins can delete faculty" ON public.faculty
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- Notices
DROP POLICY IF EXISTS "managers delete notices" ON public.notices;
CREATE POLICY "admins delete notices" ON public.notices
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- Notice categories
DROP POLICY IF EXISTS "managers delete categories" ON public.notice_categories;
CREATE POLICY "admins delete categories" ON public.notice_categories
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- Gallery albums
DROP POLICY IF EXISTS "Managers can delete albums" ON public.gallery_albums;
CREATE POLICY "Admins can delete albums" ON public.gallery_albums
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- FAQs
DROP POLICY IF EXISTS "Managers can delete faqs" ON public.faqs;
CREATE POLICY "Admins can delete faqs" ON public.faqs
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- Testimonials
DROP POLICY IF EXISTS "Managers can delete testimonials" ON public.testimonials;
CREATE POLICY "Admins can delete testimonials" ON public.testimonials
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- Education aid sections
DROP POLICY IF EXISTS "Managers can delete sections" ON public.education_aid_sections;
CREATE POLICY "Admins can delete sections" ON public.education_aid_sections
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- Certificates
DROP POLICY IF EXISTS "Managers can delete certificates" ON public.certificates;
CREATE POLICY "Admins can delete certificates" ON public.certificates
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

-- ============================================================================
-- Course publishing: Web Managers may create/edit but never publish.
-- Replace INSERT policy so WM inserts must be drafts, and add a BEFORE trigger
-- that keeps is_published locked for WM on both INSERT and UPDATE.
-- ============================================================================

DROP POLICY IF EXISTS "Managers can insert courses" ON public.courses;
CREATE POLICY "Staff can insert courses" ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR (
      public.has_role(auth.uid(), 'web_manager'::public.app_role)
      AND is_published = false
    )
  );

CREATE OR REPLACE FUNCTION public.protect_course_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for authenticated non-administrator staff (i.e. web managers)
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'administrator'::public.app_role) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_published := false;
    ELSIF TG_OP = 'UPDATE' THEN
      -- Keep the existing publish state regardless of what the client sent
      NEW.is_published := OLD.is_published;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_course_publish_trg ON public.courses;
CREATE TRIGGER protect_course_publish_trg
BEFORE INSERT OR UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.protect_course_publish();
