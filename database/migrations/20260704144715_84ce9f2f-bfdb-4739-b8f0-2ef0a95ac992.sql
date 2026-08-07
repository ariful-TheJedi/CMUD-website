
CREATE POLICY "Public can view course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

CREATE POLICY "Managers can upload course images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-images'
  AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
);

CREATE POLICY "Managers can update course images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-images'
  AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
);

CREATE POLICY "Managers can delete course images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-images'
  AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
);
