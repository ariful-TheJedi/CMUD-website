
CREATE POLICY "Managers can upload faculty images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'faculty-images'
    AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  );

CREATE POLICY "Managers can update faculty images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'faculty-images'
    AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  );

CREATE POLICY "Managers can delete faculty images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'faculty-images'
    AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  );

CREATE POLICY "Managers can read faculty images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'faculty-images'
    AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  );
