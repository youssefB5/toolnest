-- =====================================================================
-- ToolNest — roles, Row Level Security, audit log and RPC functions
-- Every SECURITY DEFINER function uses an empty search_path and fully
-- qualified names to prevent search_path hijacking.
-- =====================================================================

-- ---------- role helpers ----------
create or replace function public.role_rank(r public.app_role)
returns integer language sql immutable set search_path = '' as $$
  select case r when 'owner' then 3 when 'admin' then 2 when 'editor' then 1 else 0 end
$$;

-- Current user's active admin role, or NULL. SECURITY DEFINER so policies on
-- admin_users itself don't recurse.
create or replace function public.current_admin_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select au.role from public.admin_users au
  where au.user_id = auth.uid() and au.is_active
$$;

create or replace function public.has_admin_role(min_role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.role_rank(public.current_admin_role()) >= public.role_rank(min_role), false)
$$;

revoke all on function public.current_admin_role() from public;
revoke all on function public.has_admin_role(public.app_role) from public;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.has_admin_role(public.app_role) to anon, authenticated;

-- ---------- enable RLS everywhere ----------
alter table public.admin_users         enable row level security;
alter table public.categories          enable row level security;
alter table public.tools               enable row level security;
alter table public.site_settings       enable row level security;
alter table public.homepage_sections   enable row level security;
alter table public.pages               enable row level security;
alter table public.faqs                enable row level security;
alter table public.announcements       enable row level security;
alter table public.advertisement_slots enable row level security;
alter table public.translations        enable row level security;
alter table public.admin_activity_logs enable row level security;

-- ---------- admin_users: readable by self and admins; NO direct writes ----------
-- Changes go exclusively through set_admin_role()/remove_admin() (owner only).
create policy admin_users_select on public.admin_users for select to authenticated
  using (user_id = auth.uid() or public.has_admin_role('admin'));

-- ---------- categories ----------
create policy categories_public_read on public.categories for select to anon, authenticated
  using (is_visible or public.has_admin_role('editor'));
create policy categories_insert on public.categories for insert to authenticated
  with check (public.has_admin_role('admin'));
create policy categories_update on public.categories for update to authenticated
  using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));
create policy categories_delete on public.categories for delete to authenticated
  using (public.has_admin_role('admin'));

-- ---------- tools ----------
create policy tools_public_read on public.tools for select to anon, authenticated
  using ((status = 'published' and archived_at is null) or public.has_admin_role('editor'));
create policy tools_insert on public.tools for insert to authenticated
  with check (public.has_admin_role('editor'));
create policy tools_update on public.tools for update to authenticated
  using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));
create policy tools_delete on public.tools for delete to authenticated
  using (public.has_admin_role('admin') and status = 'archived');

-- ---------- site_settings (public, non-secret) ----------
create policy site_settings_read on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_insert on public.site_settings for insert to authenticated
  with check (public.has_admin_role('admin'));
create policy site_settings_update on public.site_settings for update to authenticated
  using (public.has_admin_role('admin')) with check (public.has_admin_role('admin'));

-- ---------- homepage_sections ----------
create policy homepage_read on public.homepage_sections for select to anon, authenticated using (true);
create policy homepage_write on public.homepage_sections for update to authenticated
  using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));
create policy homepage_insert on public.homepage_sections for insert to authenticated
  with check (public.has_admin_role('admin'));

-- ---------- pages ----------
create policy pages_read on public.pages for select to anon, authenticated
  using (status = 'published' or public.has_admin_role('editor'));
create policy pages_insert on public.pages for insert to authenticated with check (public.has_admin_role('editor'));
create policy pages_update on public.pages for update to authenticated
  using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));
create policy pages_delete on public.pages for delete to authenticated using (public.has_admin_role('admin'));

-- ---------- faqs ----------
create policy faqs_read on public.faqs for select to anon, authenticated
  using (is_published or public.has_admin_role('editor'));
create policy faqs_insert on public.faqs for insert to authenticated with check (public.has_admin_role('editor'));
create policy faqs_update on public.faqs for update to authenticated
  using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));
create policy faqs_delete on public.faqs for delete to authenticated using (public.has_admin_role('editor'));

-- ---------- announcements ----------
create policy announcements_read on public.announcements for select to anon, authenticated
  using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.has_admin_role('editor'));
create policy announcements_insert on public.announcements for insert to authenticated with check (public.has_admin_role('editor'));
create policy announcements_update on public.announcements for update to authenticated
  using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));
create policy announcements_delete on public.announcements for delete to authenticated using (public.has_admin_role('editor'));

-- ---------- advertisement_slots (admin only) ----------
create policy ads_read on public.advertisement_slots for select to anon, authenticated
  using (is_enabled or public.has_admin_role('admin'));
create policy ads_insert on public.advertisement_slots for insert to authenticated with check (public.has_admin_role('admin'));
create policy ads_update on public.advertisement_slots for update to authenticated
  using (public.has_admin_role('admin')) with check (public.has_admin_role('admin'));

-- ---------- translations ----------
create policy translations_read on public.translations for select to anon, authenticated
  using (status = 'published' or public.has_admin_role('editor'));
create policy translations_insert on public.translations for insert to authenticated with check (public.has_admin_role('editor'));
create policy translations_update on public.translations for update to authenticated
  using (public.has_admin_role('editor')) with check (public.has_admin_role('editor'));
create policy translations_delete on public.translations for delete to authenticated using (public.has_admin_role('editor'));

-- ---------- activity logs: read by admins; written only by triggers/functions ----------
create policy logs_read on public.admin_activity_logs for select to authenticated using (public.has_admin_role('admin'));
revoke insert, update, delete, truncate on public.admin_activity_logs from anon, authenticated;
revoke insert, update, delete, truncate on public.admin_users from anon, authenticated;

-- ---------- audit trigger ----------
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_row jsonb := coalesce(v_new, v_old);
  v_changed text[];
  v_action text := tg_table_name || '.' || lower(tg_op);
  v_details jsonb := '{}'::jsonb;
  v_email text;
begin
  if tg_op = 'UPDATE' then
    select array_agg(k) into v_changed
    from jsonb_object_keys(v_new) k
    where k not in ('updated_at', 'updated_by') and v_new -> k is distinct from v_old -> k;
    if v_changed is null then return null; end if; -- no meaningful change
    v_details := jsonb_build_object('changed', to_jsonb(v_changed));
    -- record old/new only for small status-like fields (never content or secrets)
    if tg_table_name = 'tools' then
      if 'status' = any(v_changed) then
        v_action := case v_new ->> 'status' when 'published' then 'tools.publish' when 'archived' then 'tools.archive' else 'tools.unpublish' end;
      elsif 'is_enabled' = any(v_changed) then
        v_action := case when (v_new ->> 'is_enabled')::boolean then 'tools.enable' else 'tools.disable' end;
      elsif 'is_maintenance' = any(v_changed) then
        v_action := 'tools.maintenance';
      elsif v_changed && array['seo_title', 'meta_description', 'keywords'] then
        v_action := 'tools.seo_update';
      end if;
      v_details := v_details || jsonb_build_object('status', jsonb_build_object('old', v_old -> 'status', 'new', v_new -> 'status'),
                                                   'enabled', v_new -> 'is_enabled', 'maintenance', v_new -> 'is_maintenance');
    elsif tg_table_name = 'admin_users' then
      v_action := 'admin_users.role_change';
      v_details := v_details || jsonb_build_object('role', jsonb_build_object('old', v_old -> 'role', 'new', v_new -> 'role'),
                                                   'active', v_new -> 'is_active');
    elsif tg_table_name = 'site_settings' then
      v_action := 'settings.' || (v_new ->> 'key');
    end if;
  end if;
  select au.email into v_email from public.admin_users au where au.user_id = auth.uid();
  insert into public.admin_activity_logs (actor_id, actor_email, action, entity_type, entity_id, details)
  values (auth.uid(), v_email, v_action, tg_table_name,
          coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'user_id'), v_details);
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['admin_users','categories','tools','site_settings','homepage_sections','pages','faqs','announcements','advertisement_slots','translations']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row()', t || '_audit', t);
  end loop;
end $$;

-- ---------- RPC: explicit event logging (login/logout/export) ----------
create or replace function public.log_admin_event(p_action text, p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.current_admin_role() is null then
    raise exception 'not an administrator' using errcode = '42501';
  end if;
  if p_action not in ('auth.login', 'auth.logout', 'export.download', 'import.apply', 'logs.download') then
    raise exception 'action not allowed' using errcode = '22023';
  end if;
  if pg_column_size(p_details) > 4000 then
    raise exception 'details too large' using errcode = '22023';
  end if;
  insert into public.admin_activity_logs (actor_id, actor_email, action, details)
  select auth.uid(), au.email, p_action, coalesce(p_details, '{}'::jsonb)
  from public.admin_users au where au.user_id = auth.uid();
end $$;
revoke all on function public.log_admin_event(text, jsonb) from public;
grant execute on function public.log_admin_event(text, jsonb) to authenticated;

-- ---------- RPC: role management (owner only, never on self) ----------
create or replace function public.set_admin_role(p_email text, p_role public.app_role, p_active boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid;
begin
  if public.current_admin_role() is distinct from 'owner' then
    raise exception 'only the owner can manage administrators' using errcode = '42501';
  end if;
  select u.id into v_uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if v_uid is null then
    raise exception 'no Supabase Auth user with this email — invite or create the user first' using errcode = 'P0002';
  end if;
  if v_uid = auth.uid() then
    raise exception 'you cannot change your own role' using errcode = '42501';
  end if;
  insert into public.admin_users (user_id, email, role, is_active, created_by)
  values (v_uid, lower(trim(p_email)), p_role, p_active, auth.uid())
  on conflict (user_id) do update set role = excluded.role, is_active = excluded.is_active;
end $$;

create or replace function public.remove_admin(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.current_admin_role() is distinct from 'owner' then
    raise exception 'only the owner can manage administrators' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'you cannot remove yourself' using errcode = '42501';
  end if;
  delete from public.admin_users where user_id = p_user_id;
end $$;

-- Ensure at least one active owner always remains.
create or replace function public.guard_last_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.admin_users where role = 'owner' and is_active) = 0 then
    raise exception 'at least one active owner must remain' using errcode = '23514';
  end if;
  return null;
end $$;
drop trigger if exists admin_users_last_owner on public.admin_users;
create constraint trigger admin_users_last_owner after update or delete on public.admin_users
  deferrable initially deferred for each row execute function public.guard_last_owner();

revoke all on function public.set_admin_role(text, public.app_role, boolean) from public;
revoke all on function public.remove_admin(uuid) from public;
grant execute on function public.set_admin_role(text, public.app_role, boolean) to authenticated;
grant execute on function public.remove_admin(uuid) to authenticated;

-- ---------- RPC: whole public payload in one round trip ----------
-- SECURITY INVOKER: RLS still applies; filters are repeated explicitly so even an
-- authenticated admin calling it only receives published content.
create or replace function public.public_site_payload()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'settings', coalesce((select jsonb_agg(jsonb_build_object('key', s.key, 'value', s.value)) from public.site_settings s), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(to_jsonb(c) order by c.sort_order) from public.categories c where c.is_visible), '[]'::jsonb),
    'tools', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' order by t.sort_order) from public.tools t
                       where t.status = 'published' and t.archived_at is null), '[]'::jsonb),
    'homepage_sections', coalesce((select jsonb_agg(to_jsonb(h)) from public.homepage_sections h), '[]'::jsonb),
    'faqs', coalesce((select jsonb_agg(to_jsonb(f)) from public.faqs f where f.is_published), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(to_jsonb(p)) from public.pages p where p.status = 'published'), '[]'::jsonb),
    'announcements', coalesce((select jsonb_agg(to_jsonb(a)) from public.announcements a
                               where a.is_active and (a.starts_at is null or a.starts_at <= now()) and (a.ends_at is null or a.ends_at > now())), '[]'::jsonb),
    'ad_slots', coalesce((select jsonb_agg(to_jsonb(x)) from public.advertisement_slots x where x.is_enabled), '[]'::jsonb),
    'translations', coalesce((select jsonb_agg(jsonb_build_object('locale', tr.locale, 'entity_type', tr.entity_type, 'entity_id', tr.entity_id, 'field', tr.field, 'value', tr.value))
                              from public.translations tr where tr.status = 'published'), '[]'::jsonb)
  )
$$;
grant execute on function public.public_site_payload() to anon, authenticated;
