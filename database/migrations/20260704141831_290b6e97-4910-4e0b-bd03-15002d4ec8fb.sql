
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  duration TEXT NOT NULL,
  mode TEXT NOT NULL,
  eligibility TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  fee INTEGER NOT NULL DEFAULT 0,
  discount_fee INTEGER NOT NULL DEFAULT 0,
  syllabus TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  outcomes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published courses"
  ON public.courses FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

CREATE POLICY "Managers can view all courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );

CREATE POLICY "Managers can insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );

CREATE POLICY "Managers can update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );

CREATE POLICY "Managers can delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX courses_sort_order_idx ON public.courses(sort_order, name);
CREATE INDEX courses_featured_idx ON public.courses(featured) WHERE featured = TRUE;
