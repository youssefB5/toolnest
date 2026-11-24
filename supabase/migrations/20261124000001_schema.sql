-- =====================================================================
-- ToolNest — core schema
-- Public site reads only published content through RLS.
-- Administrative writes require an active row in admin_users (owner/admin/editor).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type public.app_role as enum ('owner', 'admin', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tool_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.content_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- admin_users ----------
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null check (char_length(email) between 3 and 320),
  role        public.app_role not null default 'editor',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null
);
create unique index if not exists admin_users_email_key on public.admin_users (lower(email));
create trigger admin_users_updated before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ---------- categories ----------
create table if not exists public.categories (
  id               text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 60),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  icon             text not null default 'Folder' check (icon ~ '^[A-Za-z0-9]{1,40}$'),
  title            text not null check (char_length(title) between 1 and 80),
  description      text not null default '' check (char_length(description) <= 500),
  sort_order       integer not null default 100 check (sort_order between 0 and 100000),
  is_visible       boolean not null default true,
  seo_title        text check (char_length(seo_title) <= 70),
  meta_description text check (char_length(meta_description) <= 170),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------- tools ----------
-- implementation_key must reference processing code that exists in the codebase
-- (src/types/tool.ts IMPLEMENTATION_KEYS). It is NOT executable content.
create table if not exists public.tools (
  id                 text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 80),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  implementation_key text not null check (implementation_key in (
    'image-compressor','image-resizer','image-cropper','image-converter','image-rotator','image-to-base64','base64-to-image',
    'image-color-picker','image-metadata-viewer','image-metadata-remover','favicon-generator','svg-to-png',
    'pdf-merge','pdf-split','pdf-compress','pdf-rotate','pdf-extract-pages','pdf-reorder','images-to-pdf','pdf-to-images',
    'pdf-page-numbers','pdf-watermark','pdf-page-counter','pdf-info',
    'word-counter','character-counter','case-converter','remove-duplicate-lines','sort-lines','find-and-replace','text-diff',
    'slug-generator','line-number-generator',
    'json-formatter','xml-formatter','url-encoder','base64-text','html-entity-encoder','jwt-decoder','unix-timestamp-converter','regex-tester',
    'csv-to-json','json-to-csv','unit-converter','temperature-converter','file-size-converter','color-converter',
    'percentage-calculator','discount-calculator','vat-calculator','age-calculator','date-difference-calculator','aspect-ratio-calculator',
    'qr-code-generator','css-gradient-generator','markdown-previewer','lorem-ipsum-generator',
    'uuid-generator','password-generator','sha256-hash'
  )),
  category_id        text not null references public.categories (id) on update cascade on delete restrict,
  icon               text not null default 'Wrench' check (icon ~ '^[A-Za-z0-9]{1,40}$'),
  title              text not null check (char_length(title) between 1 and 100),
  short_description  text not null check (char_length(short_description) between 1 and 300),
  description        text check (char_length(description) <= 3000),
  instructions       jsonb check (instructions is null or (jsonb_typeof(instructions) = 'array' and jsonb_array_length(instructions) <= 20)),
  seo_title          text check (char_length(seo_title) <= 70),
  meta_description   text check (char_length(meta_description) <= 170),
  keywords           text[] not null default '{}' check (cardinality(keywords) <= 30),
  status             public.tool_status not null default 'draft',
  is_enabled         boolean not null default true,
  is_featured        boolean not null default false,
  is_popular         boolean not null default false,
  is_maintenance     boolean not null default false,
  sort_order         integer not null default 1000 check (sort_order between 0 and 100000),
  published_at       timestamptz,
  archived_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users (id) on delete set null
);
create index if not exists tools_category_idx on public.tools (category_id);
create index if not exists tools_status_idx on public.tools (status) where archived_at is null;
create index if not exists tools_sort_idx on public.tools (sort_order);
create trigger tools_updated before update on public.tools
  for each row execute function public.set_updated_at();

create or replace function public.tools_status_dates()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_by := auth.uid();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') and new.published_at is null then
    new.published_at := now();
  end if;
  if new.status = 'archived' and (tg_op = 'INSERT' or old.status <> 'archived') then
    new.archived_at := now();
  elsif new.status <> 'archived' then
    new.archived_at := null;
  end if;
  return new;
end $$;
create trigger tools_status_dates before insert or update on public.tools
  for each row execute function public.tools_status_dates();

-- ---------- site_settings ----------
-- Only public, non-secret settings. Never store API secrets here: this table is publicly readable.
create table if not exists public.site_settings (
  key         text primary key check (key in ('branding', 'seo', 'general', 'ads', 'navigation')),
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  constraint site_settings_size check (pg_column_size(value) < 65536)
);
create trigger site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------- homepage_sections ----------
create table if not exists public.homepage_sections (
  id          text primary key check (id in ('hero', 'popular', 'categories', 'recent', 'why', 'faq', 'seo')),
  is_enabled  boolean not null default true,
  sort_order  integer not null default 0,
  title       text check (char_length(title) <= 150),
  subtitle    text check (char_length(subtitle) <= 400),
  body        text check (char_length(body) <= 20000),
  cta_text    text check (char_length(cta_text) <= 60),
  updated_at  timestamptz not null default now()
);
create trigger homepage_sections_updated before update on public.homepage_sections
  for each row execute function public.set_updated_at();

-- ---------- pages ----------
create table if not exists public.pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  locale           text not null default 'en' check (locale in ('en', 'fr', 'ar')),
  page_type        text not null default 'custom' check (page_type in ('info', 'legal', 'help', 'custom')),
  title            text not null check (char_length(title) between 1 and 150),
  body_markdown    text not null default '' check (char_length(body_markdown) <= 100000),
  status           public.content_status not null default 'draft',
  seo_title        text check (char_length(seo_title) <= 70),
  meta_description text check (char_length(meta_description) <= 170),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (slug, locale)
);
create trigger pages_updated before update on public.pages
  for each row execute function public.set_updated_at();

-- ---------- faqs ----------
create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  scope        text not null default 'home' check (scope in ('home', 'tool', 'general')),
  tool_id      text references public.tools (id) on update cascade on delete cascade,
  locale       text not null default 'en' check (locale in ('en', 'fr', 'ar')),
  question     text not null check (char_length(question) between 3 and 300),
  answer       text not null check (char_length(answer) between 1 and 3000),
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check ((scope = 'tool') = (tool_id is not null))
);
create index if not exists faqs_scope_idx on public.faqs (scope, locale);
create trigger faqs_updated before update on public.faqs
  for each row execute function public.set_updated_at();

-- ---------- announcements ----------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  message     text not null check (char_length(message) between 1 and 300),
  link_url    text check (link_url is null or link_url ~ '^(https://|/)[^\s<>"'']*$'),
  level       text not null default 'info' check (level in ('info', 'warning', 'success')),
  locale      text check (locale is null or locale in ('en', 'fr', 'ar')),
  is_active   boolean not null default false,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create trigger announcements_updated before update on public.announcements
  for each row execute function public.set_updated_at();

-- ---------- advertisement_slots ----------
-- No custom HTML/JS: only an AdSense slot ID (digits). Disabled by default.
create table if not exists public.advertisement_slots (
  id            text primary key check (id in ('header', 'home', 'category', 'tool', 'footer')),
  is_enabled    boolean not null default false,
  ad_slot_id    text check (ad_slot_id is null or ad_slot_id ~ '^\d{4,20}$'),
  show_desktop  boolean not null default true,
  show_mobile   boolean not null default true,
  min_height    integer not null default 250 check (min_height between 50 and 600),
  lazy_load     boolean not null default true,
  label         text not null default 'Advertisement' check (char_length(label) <= 40),
  updated_at    timestamptz not null default now()
);
create trigger advertisement_slots_updated before update on public.advertisement_slots
  for each row execute function public.set_updated_at();

-- ---------- translations ----------
create table if not exists public.translations (
  id           uuid primary key default gen_random_uuid(),
  locale       text not null check (locale in ('fr', 'ar')),
  entity_type  text not null check (entity_type in ('tool', 'category', 'homepage', 'ui')),
  entity_id    text not null check (char_length(entity_id) <= 80),
  field        text not null check (field in ('title', 'short_description', 'description', 'instructions', 'seo_title', 'meta_description', 'subtitle', 'body', 'cta_text')),
  value        text not null check (char_length(value) between 1 and 20000),
  status       public.content_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (locale, entity_type, entity_id, field)
);
create trigger translations_updated before update on public.translations
  for each row execute function public.set_updated_at();

-- ---------- admin_activity_logs ----------
create table if not exists public.admin_activity_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid references auth.users (id) on delete set null,
  actor_email  text,
  action       text not null check (char_length(action) <= 80),
  entity_type  text check (char_length(entity_type) <= 60),
  entity_id    text check (char_length(entity_id) <= 120),
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists admin_activity_logs_created_idx on public.admin_activity_logs (created_at desc);
