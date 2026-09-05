
CREATE TABLE public.education_aid_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_aid_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_aid_sections TO authenticated;
GRANT ALL ON public.education_aid_sections TO service_role;
ALTER TABLE public.education_aid_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published sections" ON public.education_aid_sections
  FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Managers can read all sections" ON public.education_aid_sections
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can insert sections" ON public.education_aid_sections
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can update sections" ON public.education_aid_sections
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can delete sections" ON public.education_aid_sections
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );

CREATE TABLE public.education_aid_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.education_aid_sections(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_aid_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_aid_slides TO authenticated;
GRANT ALL ON public.education_aid_slides TO service_role;
ALTER TABLE public.education_aid_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read slides of published sections" ON public.education_aid_slides
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.education_aid_sections s WHERE s.id = section_id AND s.is_published = true)
  );
CREATE POLICY "Managers can read all slides" ON public.education_aid_slides
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can insert slides" ON public.education_aid_slides
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can update slides" ON public.education_aid_slides
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can delete slides" ON public.education_aid_slides
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );

CREATE TRIGGER update_education_aid_sections_updated_at
  BEFORE UPDATE ON public.education_aid_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.education_aid_sections (title, description, sort_order, is_published) VALUES
  ('Ultrasound Machine', 'Trainees learn on modern, high-resolution ultrasound machines with convex, linear, and phased-array probes — the same class of equipment used in leading diagnostic centres.', 10, true),
  ('Clinic', 'Our attached subsidized diagnostic clinic (Thyroid Clinic) gives every learner exposure to real workflow — from patient reception and history taking to scanning, reporting, and case discussion.', 20, true),
  ('Patient', 'A steady flow of real patients across abdominal, obstetric, gynaecological, small-parts, and vascular cases ensures trainees see the pathology they will encounter in practice.', 30, true),
  ('Digital Classroom', 'Interactive digital classrooms with large displays, live scan streaming, and recorded case libraries make theory sessions engaging and easy to revisit.', 40, true),
  ('Course Book', 'Every trainee receives CMUD''s structured course book — protocols, measurement charts, reporting templates, and reference images curated by our faculty.', 50, true);
