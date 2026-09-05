CREATE TABLE public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  page_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_content TO authenticated;
GRANT ALL ON public.page_content TO service_role;

ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Page content is publicly readable"
  ON public.page_content FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Staff can insert page content"
  ON public.page_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::public.app_role)
           OR public.has_role(auth.uid(), 'web_manager'::public.app_role));

CREATE POLICY "Staff can update page content"
  ON public.page_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role)
      OR public.has_role(auth.uid(), 'web_manager'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::public.app_role)
           OR public.has_role(auth.uid(), 'web_manager'::public.app_role));

CREATE POLICY "Administrators can delete page content"
  ON public.page_content FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.page_content (title, slug, meta_title, meta_description, page_data) VALUES (
  'Home Page',
  'home',
  'CMUD — College of Medical Ultrasound & Doppler',
  'Hands-on professional training in medical ultrasound and Doppler imaging. CMUD trains doctors and sonographers with expert faculty and live patient sessions.',
  '{
    "hero": {
      "badge": "Admissions open — July 2026",
      "heading": "Master medical ultrasound with hands-on training that matters.",
      "description": "CMUD is a dedicated institute for diagnostic ultrasound and Doppler imaging. Learn from senior consultants, scan real patients daily, and graduate ready to practise. Get Free repeat Classes and unlimited practical session for 1 year.",
      "primaryCtaLabel": "Apply Now",
      "primaryCtaHref": "/admission",
      "secondaryCtaLabel": "View Courses",
      "secondaryCtaHref": "/courses",
      "imageUrl": "",
      "imageAlt": "CMUD instructor demonstrating ultrasound scanning",
      "stats": [
        { "value": "1,200+", "label": "Trainees" },
        { "value": "12", "label": "Years" },
        { "value": "25+", "label": "Faculty" }
      ]
    },
    "handsOn": {
      "eyebrow": "Hands-on Ultrasound Training",
      "title": "Real patients. Real protocols. Real reports.",
      "description": "CMUD has integrated clinic and partnered with NGOs so you practise on actual cases — from routine abdominal scans to complex fetal Doppler — under expert supervision.",
      "imageUrl": "",
      "imageAlt": "Trainee performing an obstetric ultrasound scan",
      "badgeValue": "120+",
      "badgeLabel": "scans per trainee",
      "bullets": [
        "Small batches of 3-5 trainees per advanced course",
        "Daily live patient scanning sessions",
        "Structured reporting templates",
        "Everyday Case review of own clinic patients"
      ],
      "ctaLabel": "More about CMUD",
      "ctaHref": "/about"
    }
  }'::jsonb
);