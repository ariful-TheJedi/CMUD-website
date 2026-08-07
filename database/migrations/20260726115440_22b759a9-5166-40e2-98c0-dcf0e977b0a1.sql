CREATE POLICY "Viewers can read admission applications"
ON public.admission_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'viewer'::public.app_role));

CREATE POLICY "Viewers can read admission notes"
ON public.admission_application_notes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'viewer'::public.app_role));