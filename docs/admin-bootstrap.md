# Initial Administrator Bootstrap

Public sign-up is disabled and the application no longer promotes the first
signed-in user to Administrator automatically. Provision the very first
Administrator manually, one time only.

## Steps

1. In the Lovable Cloud backend, create the user (email + a strong temporary
   password), or trigger a one-off Supabase Auth invite for the email.
2. Confirm the user's email so they can sign in.
3. Run this SQL against the project database (via the Lovable Cloud SQL
   editor / an ad-hoc migration), substituting the real email:

   ```sql
   with target as (
     select id from auth.users where email = 'admin@example.com'
   )
   insert into public.profiles (id, email, full_name, status)
   select id, 'admin@example.com', 'Initial Administrator', 'active'::user_status
   from target
   on conflict (id) do update
     set status = 'active'::user_status,
         email  = excluded.email;

   insert into public.user_roles (user_id, role)
   select id, 'administrator'::app_role from target
   on conflict (user_id, role) do nothing;
   ```

4. Sign in at `/admin/login` with that account.
5. Invite any additional Administrators or Web Managers from
   `/admin/users` — this is now the only supported way to create staff
   accounts.

No further bootstrap steps are required, and there is no runtime endpoint
that can create Administrator access.
