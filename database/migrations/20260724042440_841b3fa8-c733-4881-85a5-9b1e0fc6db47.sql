
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.admission_status AS ENUM ('new', 'contacted', 'admitted', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Applications
CREATE TABLE public.admission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  qualification TEXT NOT NULL,
  medical_college TEXT NOT NULL,
  bmdc_number TEXT NOT NULL,
  preferred_branch TEXT NOT NULL CHECK (preferred_branch IN ('Panthapath','Uttara')),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_slug TEXT NOT NULL,
  course_name TEXT NOT NULL,
  preferred_batch TEXT NOT NULL,
  address TEXT NOT NULL,
  applicant_message TEXT,
  status public.admission_status NOT NULL DEFAULT 'new',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_updated_at TIMESTAMPTZ,
  status_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admission_applications TO authenticated;
GRANT ALL ON public.admission_applications TO service_role;

ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read applications"
  ON public.admission_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

CREATE POLICY "Admins can update applications"
  ON public.admission_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::public.app_role));

CREATE POLICY "Admins can delete applications"
  ON public.admission_applications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

CREATE INDEX idx_admissions_status ON public.admission_applications(status);
CREATE INDEX idx_admissions_submitted_at ON public.admission_applications(submitted_at DESC);
CREATE INDEX idx_admissions_email ON public.admission_applications(email);
CREATE INDEX idx_admissions_phone ON public.admission_applications(phone);
CREATE INDEX idx_admissions_bmdc ON public.admission_applications(bmdc_number);
CREATE INDEX idx_admissions_course ON public.admission_applications(course_id);
CREATE INDEX idx_admissions_branch ON public.admission_applications(preferred_branch);

CREATE TRIGGER update_admission_applications_updated_at
  BEFORE UPDATE ON public.admission_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notes
CREATE TABLE public.admission_application_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admission_application_notes TO authenticated;
GRANT ALL ON public.admission_application_notes TO service_role;

ALTER TABLE public.admission_application_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read notes"
  ON public.admission_application_notes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

CREATE POLICY "Admins can insert notes"
  ON public.admission_application_notes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::public.app_role) AND created_by = auth.uid());

CREATE POLICY "Admins can update own recent notes"
  ON public.admission_application_notes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role) AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::public.app_role) AND created_by = auth.uid());

CREATE INDEX idx_admission_notes_app ON public.admission_application_notes(admission_application_id, created_at DESC);

CREATE TRIGGER update_admission_notes_updated_at
  BEFORE UPDATE ON public.admission_application_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generic content reference on audit_logs (non-breaking additive columns)
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS content_id UUID;
