-- Maklarforum.se initial schema (v2.0)
-- Date: 2026-02-18

create extension if not exists "pgcrypto";

create type app_role as enum ('consumer', 'agent', 'admin');
create type verification_status as enum ('pending', 'verified', 'suspended');
create type audience_type as enum ('buyer', 'seller', 'general');
create type question_category as enum ('kopa', 'salja', 'juridik', 'vardering', 'flytt', 'ovrigt');
create type geo_scope as enum ('local', 'regional', 'open');
create type question_status as enum ('open', 'answered', 'closed');
create type forum_category as enum ('juridik', 'budgivning', 'teknik', 'rekrytering', 'allmant');
create type listing_status as enum ('active', 'sold');
create type report_content_type as enum ('answer', 'comment', 'forum_post');
create type report_status as enum ('pending', 'reviewed', 'actioned');
create type subscription_status as enum ('none', 'trial', 'active', 'past_due', 'canceled');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'consumer',
  full_name text not null,
  email text not null unique,
  avatar_url text,
  fmi_number text,
  firm text,
  title text,
  bio text,
  city text,
  verification_status verification_status not null default 'pending',
  profile_slug text unique,
  notification_prefs jsonb not null default jsonb_build_object('new_question_email', 'immediate', 'new_message_email', 'immediate'),
  subscription_status subscription_status not null default 'none',
  stripe_customer_id text,
  stripe_subscription_id text,
  accepted_terms_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_areas (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references profiles(id) on delete cascade,
  municipality text not null,
  region text not null,
  created_at timestamptz not null default now(),
  unique (agent_id, municipality)
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  asked_by uuid not null references profiles(id) on delete cascade,
  title text not null,
  question_slug text not null unique,
  body text not null,
  audience audience_type not null,
  category question_category not null,
  geo_scope geo_scope not null,
  municipality text,
  region text,
  status question_status not null default 'open',
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  answered_by uuid not null references profiles(id) on delete cascade,
  body text not null,
  helpful_votes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, answered_by)
);

create table if not exists answer_comments (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  unique (answer_id, author_id)
);

create table if not exists question_watchers (
  question_id uuid not null references questions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  category forum_category not null,
  title text not null,
  body text not null,
  reply_count integer not null default 0,
  is_recruiting boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists agent_listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  price integer not null,
  area text not null,
  image_url text,
  hemnet_url text,
  status listing_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists reported_content (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid not null references profiles(id) on delete cascade,
  content_type report_content_type not null,
  content_id uuid not null,
  reason text not null,
  status report_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table agent_areas enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table answer_comments enable row level security;
alter table question_watchers enable row level security;
alter table messages enable row level security;
alter table forum_posts enable row level security;
alter table agent_listings enable row level security;
alter table reported_content enable row level security;

create or replace function is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

create policy "profiles public read" on profiles
for select using (true);

create policy "profiles self update" on profiles
for update using (id = auth.uid())
with check (id = auth.uid());

create policy "questions public read" on questions
for select using (true);

create policy "consumer create own question" on questions
for insert with check (
  asked_by = auth.uid() and
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'consumer')
);

create policy "agent answer only when verified" on answers
for insert with check (
  answered_by = auth.uid() and
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.verification_status = 'verified'
  )
);

create policy "answers public read" on answers
for select using (true);

create policy "answer comment only owner once" on answer_comments
for insert with check (
  author_id = auth.uid() and
  exists (select 1 from answers a where a.id = answer_id and a.answered_by = auth.uid())
);

create policy "answer comments public read" on answer_comments
for select using (true);

create policy "messages private" on messages
for select using (sender_id = auth.uid() or receiver_id = auth.uid() or is_admin(auth.uid()));

create policy "messages send" on messages
for insert with check (sender_id = auth.uid());

create policy "forum verified only" on forum_posts
for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.verification_status = 'verified'
  ) or is_admin(auth.uid())
);

create policy "forum write verified only" on forum_posts
for insert with check (
  author_id = auth.uid() and
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.verification_status = 'verified'
  )
);

create policy "reported content admin only" on reported_content
for all using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy "admin full read profiles" on profiles
for select using (is_admin(auth.uid()));

create policy "admin manage questions" on questions
for all using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy "admin manage answers" on answers
for all using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy "admin manage listings" on agent_listings
for all using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));
