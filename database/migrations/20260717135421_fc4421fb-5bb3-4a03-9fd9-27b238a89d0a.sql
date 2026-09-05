
ALTER TABLE public.notices
  ADD COLUMN attachment_url TEXT,
  ADD COLUMN attachment_name TEXT;

CREATE POLICY "notice attachments public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'notice-attachments');
CREATE POLICY "notice attachments managers insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'notice-attachments'
    AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  );
CREATE POLICY "notice attachments managers update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'notice-attachments'
    AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  );
CREATE POLICY "notice attachments managers delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'notice-attachments'
    AND (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'))
  );
