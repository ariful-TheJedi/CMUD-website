
DROP POLICY IF EXISTS "Certificates are publicly readable" ON public.certificates;
REVOKE SELECT ON public.certificates FROM anon;

CREATE POLICY "Staff can read certificates"
  ON public.certificates
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'web_manager'::public.app_role)
  );
