
CREATE POLICY "Public can read gallery images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'gallery-images');
CREATE POLICY "Managers can upload gallery images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'gallery-images' AND (
      public.has_role(auth.uid(), 'administrator'::public.app_role)
      OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
    )
  );
CREATE POLICY "Managers can update gallery images" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'gallery-images' AND (
      public.has_role(auth.uid(), 'administrator'::public.app_role)
      OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
    )
  );
CREATE POLICY "Managers can delete gallery images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'gallery-images' AND (
      public.has_role(auth.uid(), 'administrator'::public.app_role)
      OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
    )
  );
