CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published faqs"
  ON public.faqs FOR SELECT
  USING (is_published = true);

CREATE POLICY "Managers can view all faqs"
  ON public.faqs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can insert faqs"
  ON public.faqs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can update faqs"
  ON public.faqs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can delete faqs"
  ON public.faqs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('Who can apply to CMUD courses?', 'Most programs are open to MBBS, BDS, postgraduate trainees, and allied health professionals. Each course page lists specific eligibility.', 10),
  ('How much hands-on scanning will I get?', 'We cap batch sizes so each trainee gets a minimum of two hours of daily live scanning with real patients and standardised protocols.', 20),
  ('Will I receive a certificate?', 'Yes. CMUD certificates are issued on successful completion of the course, including a practical assessment and a structured reporting test.', 30),
  ('Are courses available online?', 'Theory components for several courses are available online, but hands-on modules require onsite attendance at our training centre.', 40),
  ('Do you offer instalment payment?', 'Yes. Most full-length courses can be paid in two or three instalments. Please contact admissions for details.', 50),
  ('Is there a placement support?', 'We maintain an alumni network and share opportunities from partner hospitals and diagnostic centres with our graduates.', 60);