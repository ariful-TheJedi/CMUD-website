
CREATE POLICY "Public read education aid images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'education-aid-images');
CREATE POLICY "Managers upload education aid images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'education-aid-images' AND (
      public.has_role(auth.uid(), 'administrator'::public.app_role)
      OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
    )
  );
CREATE POLICY "Managers update education aid images" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'education-aid-images' AND (
      public.has_role(auth.uid(), 'administrator'::public.app_role)
      OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
    )
  );
CREATE POLICY "Managers delete education aid images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'education-aid-images' AND (
      public.has_role(auth.uid(), 'administrator'::public.app_role)
      OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
    )
  );
