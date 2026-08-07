
CREATE TABLE public.notice_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  display_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notice_attachments_notice_id_idx ON public.notice_attachments(notice_id);

GRANT SELECT ON public.notice_attachments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notice_attachments TO authenticated;
GRANT ALL ON public.notice_attachments TO service_role;

ALTER TABLE public.notice_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view attachments of published notices"
  ON public.notice_attachments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.notices n WHERE n.id = notice_id AND n.is_published = true));

CREATE POLICY "Managers can view all attachments"
  ON public.notice_attachments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can insert attachments"
  ON public.notice_attachments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can update attachments"
  ON public.notice_attachments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

CREATE POLICY "Managers can delete attachments"
  ON public.notice_attachments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'web_manager'));

-- Migrate existing single attachments into the new table
INSERT INTO public.notice_attachments (notice_id, file_url, file_name, display_name, sort_order)
SELECT id, attachment_url, COALESCE(attachment_name, 'Attachment'), NULL, 0
FROM public.notices
WHERE attachment_url IS NOT NULL;
