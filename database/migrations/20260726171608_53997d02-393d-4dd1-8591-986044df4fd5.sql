CREATE POLICY "Viewers can update admission status"
ON public.admission_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'viewer'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'viewer'::public.app_role));

CREATE OR REPLACE FUNCTION public.restrict_viewer_admission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'administrator'::public.app_role)
     AND public.has_role(auth.uid(), 'viewer'::public.app_role) THEN
    -- viewers may only change status metadata; restore everything else
    NEW.full_name := OLD.full_name;
    NEW.email := OLD.email;
    NEW.phone := OLD.phone;
    NEW.bmdc_number := OLD.bmdc_number;
    NEW.preferred_branch := OLD.preferred_branch;
    NEW.preferred_batch := OLD.preferred_batch;
    NEW.course_id := OLD.course_id;
    NEW.course_name := OLD.course_name;
    NEW.applicant_message := OLD.applicant_message;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_viewer_admission_update ON public.admission_applications;
CREATE TRIGGER trg_restrict_viewer_admission_update
BEFORE UPDATE ON public.admission_applications
FOR EACH ROW EXECUTE FUNCTION public.restrict_viewer_admission_update();