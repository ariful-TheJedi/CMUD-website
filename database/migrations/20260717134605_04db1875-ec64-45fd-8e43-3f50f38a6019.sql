
CREATE TABLE public.notice_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notice_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notice_categories TO authenticated;
GRANT ALL ON public.notice_categories TO service_role;
ALTER TABLE public.notice_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories readable by all" ON public.notice_categories FOR SELECT USING (true);
CREATE POLICY "managers insert categories" ON public.notice_categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));
CREATE POLICY "managers update categories" ON public.notice_categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));
CREATE POLICY "managers delete categories" ON public.notice_categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));
CREATE TRIGGER trg_notice_categories_updated BEFORE UPDATE ON public.notice_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  notice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID REFERENCES public.notice_categories(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices public read" ON public.notices FOR SELECT USING (is_published = true);
CREATE POLICY "managers read all notices" ON public.notices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));
CREATE POLICY "managers insert notices" ON public.notices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));
CREATE POLICY "managers update notices" ON public.notices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));
CREATE POLICY "managers delete notices" ON public.notices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));
CREATE TRIGGER trg_notices_updated BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.notice_categories (name, slug) VALUES
  ('Notice', 'notice'),
  ('Routine', 'routine'),
  ('Result', 'result'),
  ('Event', 'event');

INSERT INTO public.notices (title, body, notice_date, category_id, sort_order) VALUES
  ('Admissions open: July 2026 batch', 'Apply now for the July intake of Basic Ultrasound, Advanced Doppler, and OB-GYN Ultrasound. Limited seats per batch to ensure quality hands-on time.', '2026-06-25', (SELECT id FROM public.notice_categories WHERE slug='notice'), 10),
  ('Routine: Doppler Imaging — Batch 14', 'Theory 7–9 AM, Hands-on 9–11 AM, Monday to Friday. Reporting workshop on Saturdays.', '2026-06-20', (SELECT id FROM public.notice_categories WHERE slug='routine'), 20),
  ('Results published: April 2026 batch', 'Certificates can be collected from the CMUD administrative office after June 30, 2026.', '2026-06-18', (SELECT id FROM public.notice_categories WHERE slug='result'), 30),
  ('Workshop: Fetal Echocardiography', 'Two-day intensive workshop with international faculty on July 12–13, 2026.', '2026-06-10', (SELECT id FROM public.notice_categories WHERE slug='event'), 40),
  ('New MSK ultrasound batch starting', 'Limited 12 seats. Includes live model scanning and USG-guided injection practice.', '2026-05-30', (SELECT id FROM public.notice_categories WHERE slug='notice'), 50);
