CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  course_name text NOT NULL,
  batch text NOT NULL DEFAULT '',
  year_of_admission integer,
  certificate_number text NOT NULL,
  bmdc_number text,
  mobile_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX certificates_certificate_number_key ON public.certificates (lower(certificate_number));
CREATE INDEX certificates_bmdc_number_idx ON public.certificates (lower(bmdc_number));
CREATE INDEX certificates_student_name_idx ON public.certificates (lower(student_name));

GRANT SELECT ON public.certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificates are publicly readable" ON public.certificates
  FOR SELECT USING (true);

CREATE POLICY "Managers can insert certificates" ON public.certificates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can update certificates" ON public.certificates
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can delete certificates" ON public.certificates
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();