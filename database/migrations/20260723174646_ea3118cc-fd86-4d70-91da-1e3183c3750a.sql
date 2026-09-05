
-- User status enum
CREATE TYPE public.user_status AS ENUM ('active','inactive','suspended');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.user_status NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- Protect sensitive profile columns from user self-edit
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the acting authenticated user is the row owner and NOT an administrator,
  -- preserve sensitive columns.
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id
     AND NOT public.has_role(auth.uid(), 'administrator'::public.app_role) THEN
    NEW.status := OLD.status;
    NEW.last_login_at := OLD.last_login_at;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect ON public.profiles;
CREATE TRIGGER trg_profiles_protect
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- Count of remaining active administrators (used to prevent lockout)
CREATE OR REPLACE FUNCTION public.count_active_administrators()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'administrator'::public.app_role
    AND p.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.count_active_administrators() TO authenticated;

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  target_user_id uuid,
  action text NOT NULL,
  previous_value jsonb,
  new_value jsonb,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::public.app_role));

CREATE POLICY "Admins insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::public.app_role) AND actor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
