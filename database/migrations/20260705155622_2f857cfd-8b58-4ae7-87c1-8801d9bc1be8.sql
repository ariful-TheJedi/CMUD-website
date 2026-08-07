
CREATE TABLE public.faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  credentials text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  initials text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.faculty TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty TO authenticated;
GRANT ALL ON public.faculty TO service_role;

ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published faculty"
  ON public.faculty FOR SELECT
  USING (is_published = true);

CREATE POLICY "Managers can view all faculty"
  ON public.faculty FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can insert faculty"
  ON public.faculty FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can update faculty"
  ON public.faculty FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can delete faculty"
  ON public.faculty FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE TRIGGER update_faculty_updated_at
  BEFORE UPDATE ON public.faculty
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
