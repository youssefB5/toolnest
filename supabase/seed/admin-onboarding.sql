-- =====================================================================
-- OWNER ONBOARDING — run ONCE in the Supabase Dashboard > SQL Editor.
-- The SQL editor runs as the database owner, so this bypasses RLS on purpose.
--
-- Before running:
--   1. Supabase Dashboard > Authentication > Users > "Add user" (or "Invite user")
--      with the owner's email and a strong password. Confirm the email.
--   2. Authentication > Providers > Email: DISABLE "Allow new users to sign up"
--      (there is no public registration; admins are invited only).
--   3. Replace the email below, then run this script.
-- There are no default or hard-coded credentials anywhere in the project.
-- =====================================================================

insert into public.admin_users (user_id, email, role, is_active)
select u.id, lower(u.email), 'owner', true
from auth.users u
where lower(u.email) = lower('owner@example.com')   -- <-- CHANGE THIS
on conflict (user_id) do update set role = 'owner', is_active = true;

-- Verify (should return exactly one row with role = owner):
select user_id, email, role, is_active from public.admin_users;

-- Afterwards, the owner adds other admins/editors from the Admin Dashboard
-- (Admin Users & Roles), which calls public.set_admin_role(). Those users must
-- first exist in Authentication > Users (invite them there).
