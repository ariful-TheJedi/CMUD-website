
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  quote text NOT NULL DEFAULT '',
  initials text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can insert testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.testimonials (name, role, quote, initials, sort_order) VALUES
  ('Dr. Sneha Maharjan', 'Radiology Resident', 'The hands-on hours at CMUD are unmatched. I scanned more patients here in three months than I had in my first year of residency.', 'SM', 10),
  ('Dr. Ashok Bhandari', 'General Practitioner', 'Faculty are approachable and the structured reporting templates have changed how I work in my clinic.', 'AB', 20),
  ('Dr. Rekha Joshi', 'OB-GYN Consultant', 'The OB-GYN module is rigorous and protocol-driven. I now feel fully confident with anomaly scans.', 'RJ', 30),
  ('Dr. Manish Khatri', 'Emergency Physician', 'POCUS at CMUD changed how I make decisions in the ER. Every session was case-driven and practical.', 'MK', 40);
