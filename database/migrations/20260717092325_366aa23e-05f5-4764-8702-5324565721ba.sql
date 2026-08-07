
CREATE TABLE public.gallery_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gallery_albums TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_albums TO authenticated;
GRANT ALL ON public.gallery_albums TO service_role;

ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published albums" ON public.gallery_albums
  FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "Auth can read published albums" ON public.gallery_albums
  FOR SELECT TO authenticated USING (
    is_published = true
    OR public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can insert albums" ON public.gallery_albums
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can update albums" ON public.gallery_albums
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can delete albums" ON public.gallery_albums
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );

CREATE TRIGGER update_gallery_albums_updated_at
  BEFORE UPDATE ON public.gallery_albums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX gallery_images_album_id_idx ON public.gallery_images(album_id);

GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read images of published albums" ON public.gallery_images
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM public.gallery_albums a WHERE a.id = album_id AND a.is_published = true)
  );
CREATE POLICY "Auth can read images" ON public.gallery_images
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.gallery_albums a WHERE a.id = album_id AND a.is_published = true)
    OR public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can insert images" ON public.gallery_images
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can update images" ON public.gallery_images
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
CREATE POLICY "Managers can delete images" ON public.gallery_images
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
