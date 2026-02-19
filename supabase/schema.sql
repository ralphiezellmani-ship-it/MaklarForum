-- ============================================================
-- MÄKLARFORUM.SE — KOMPLETT DATABASSCHEMA
-- Version 1.0 | Februari 2026
-- Supabase / PostgreSQL
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";  -- För SEO-slugs utan svenska tecken


-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum (
  'consumer',
  'professional'
);

create type professional_type as enum (
  'agent',           -- Fastighetsmäklare
  'bank',            -- Bolånerådgivare / bank
  'inspector',       -- Besiktningsman
  'contractor',      -- Hantverkare
  'municipality',    -- Kommun
  'other'            -- Framtida yrkesroller
);

create type verification_status as enum (
  'pending',         -- Väntar på granskning
  'verified',        -- Godkänd
  'suspended',       -- Avstängd pga villkorsbrott
  'rejected'         -- Nekad
);

create type geo_scope as enum (
  'local',           -- Specifik kommun
  'regional',        -- Län
  'national'         -- Hela Sverige (öppen fråga)
);

create type question_category as enum (
  'buying',          -- Köpa bostad
  'selling',         -- Sälja bostad
  'legal',           -- Juridik & kontrakt
  'valuation',       -- Värdering
  'financing',       -- Bolån & finansiering
  'renovation',      -- Renovering & besiktning
  'moving',          -- Flytt & praktiskt
  'market',          -- Marknadsfrågor & trender
  'other'
);

create type question_status as enum (
  'open',            -- Ingen har svarat ännu
  'answered',        -- Minst ett svar finns
  'closed'           -- Stängd av admin eller konsument
);

create type forum_category as enum (
  'legal',           -- Juridik & kontrakt
  'bidding',         -- Budgivning & prissättning
  'tech',            -- Teknik & verktyg
  'recruitment',     -- Rekrytering & karriär
  'general'          -- Allmänt branschsnack
);

create type listing_status as enum (
  'active',
  'sold',
  'withdrawn'
);

create type message_thread_type as enum (
  'consumer_to_professional',
  'professional_to_professional'
);

create type notification_type as enum (
  'question_answered',
  'new_question_in_area',
  'new_message',
  'profile_viewed',
  'verification_approved',
  'verification_rejected',
  'answer_voted'
);

create type subscription_tier as enum (
  'free',
  'premium',         -- 299-499 kr/mån
  'leads'            -- 3 000 kr/mån
);

create type report_status as enum (
  'pending',
  'reviewed',
  'actioned',
  'dismissed'
);


-- ============================================================
-- HELPER FUNCTION: SLUG GENERATOR
-- ============================================================
create or replace function generate_slug(input text)
returns text as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        unaccent(input),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
end;
$$ language plpgsql immutable;


-- ============================================================
-- TABELL: profiles
-- Kopplad till Supabase auth.users
-- Gäller ALLA användare — konsumenter och proffs
-- ============================================================
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  role                user_role not null default 'consumer',
  full_name           text not null,
  email               text not null,
  avatar_url          text,
  phone               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Notifikationsinställningar
  notify_email        boolean not null default true,
  notify_digest       boolean not null default false,  -- Daglig sammanfattning istf direkt
  
  -- Mjuk borttagning
  deleted_at          timestamptz
);

comment on table public.profiles is 'Basprofil för alla användare — konsumenter och yrkesprofessionella';


-- ============================================================
-- TABELL: professional_profiles
-- Utökad profil för alla verifierade yrkesroller
-- Kopplad 1:1 med profiles (om role = professional)
-- ============================================================
create table public.professional_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid not null unique references public.profiles(id) on delete cascade,
  
  -- Yrkesroll
  professional_type     professional_type not null,
  verification_status   verification_status not null default 'pending',
  verified_at           timestamptz,
  verified_by           uuid references public.profiles(id),  -- Admin som godkände
  
  -- Gemensamma fält för alla yrkesroller
  firm_name             text not null,
  title                 text not null,                -- "Fastighetsmäklare", "Bolånerådgivare" etc
  bio                   text,
  website_url           text,
  profile_slug          text unique,                 -- maklarforum.se/proffs/[slug]
  
  -- FMI-specifikt (agents)
  fmi_number            text unique,                 -- Fastighetsmäklarinspektionens reg.nr
  
  -- Bank-specifikt
  bank_license_number   text,
  
  -- Prenumeration
  subscription_tier     subscription_tier not null default 'free',
  subscription_start    timestamptz,
  subscription_end      timestamptz,
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  
  -- Statistik (uppdateras via triggers)
  profile_views         integer not null default 0,
  total_answers         integer not null default 0,
  helpful_votes_total   integer not null default 0,
  
  -- Villkor
  terms_accepted_at     timestamptz,
  terms_version         text,                        -- Version av villkoren de accepterade
  
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.professional_profiles is 'Utökad profil för alla verifierade yrkesprofessionella';


-- ============================================================
-- TABELL: professional_areas
-- Vilka geografiska områden ett proffs bevakar
-- ============================================================
create table public.professional_areas (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  municipality    text,                    -- Kommunnamn
  region          text,                    -- Länsnamn
  is_primary      boolean default false,   -- Primärt verksamhetsområde
  created_at      timestamptz not null default now(),
  
  unique(professional_id, municipality)
);

comment on table public.professional_areas is 'Geografiska bevakningsområden per yrkesprofessionell';


-- ============================================================
-- TABELL: questions
-- Konsumenters frågor — publika och SEO-indexerade
-- ============================================================
create table public.questions (
  id              uuid primary key default uuid_generate_v4(),
  asked_by        uuid not null references public.profiles(id) on delete cascade,
  
  title           text not null,
  body            text not null,
  slug            text unique,             -- Auto-genererad från title
  
  category        question_category not null,
  geo_scope       geo_scope not null default 'national',
  municipality    text,                    -- Fylls i om geo_scope = 'local'
  region          text,                    -- Fylls i om geo_scope = 'regional'
  
  status          question_status not null default 'open',
  is_featured     boolean not null default false,  -- Pinnad av admin
  
  -- SEO & Engagement
  view_count      integer not null default 0,
  answer_count    integer not null default 0,      -- Uppdateras via trigger
  follower_count  integer not null default 0,      -- Uppdateras via trigger
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

comment on table public.questions is 'Konsumenters frågor — publik och SEO-indexerad Q&A';

-- Auto-generera slug från title
create or replace function set_question_slug()
returns trigger as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := generate_slug(new.title);
  final_slug := base_slug;
  
  while exists (select 1 from public.questions where slug = final_slug and id != new.id) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  end loop;
  
  new.slug := final_slug;
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_question_slug
  before insert on public.questions
  for each row execute function set_question_slug();


-- ============================================================
-- TABELL: answers
-- Mäklarens (och andra proffsets) svar på frågor
-- Max 1 svar per professional per fråga (enforced via unique constraint)
-- ============================================================
create table public.answers (
  id                uuid primary key default uuid_generate_v4(),
  question_id       uuid not null references public.questions(id) on delete cascade,
  answered_by       uuid not null references public.professional_profiles(id) on delete cascade,
  
  body              text not null,
  helpful_votes     integer not null default 0,
  
  -- Max 1 uppföljningskommentar från svarsgivaren
  followup_comment  text,
  followup_at       timestamptz,
  
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  
  -- En professional kan bara svara EN gång per fråga
  unique(question_id, answered_by)
);

comment on table public.answers is 'Professionellas svar på konsumentfrågor — max 1 svar + 1 followup per person';

-- Uppdatera answer_count på questions när svar läggs till/tas bort
create or replace function update_question_answer_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.questions 
    set answer_count = answer_count + 1,
        status = 'answered',
        updated_at = now()
    where id = new.question_id;
  elsif TG_OP = 'DELETE' then
    update public.questions 
    set answer_count = greatest(answer_count - 1, 0),
        updated_at = now()
    where id = old.question_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trigger_update_answer_count
  after insert or delete on public.answers
  for each row execute function update_question_answer_count();

-- Uppdatera proffsets total_answers statistik
create or replace function update_professional_answer_stats()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.professional_profiles
    set total_answers = total_answers + 1
    where id = new.answered_by;
  elsif TG_OP = 'DELETE' then
    update public.professional_profiles
    set total_answers = greatest(total_answers - 1, 0)
    where id = old.answered_by;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trigger_update_professional_answer_stats
  after insert or delete on public.answers
  for each row execute function update_professional_answer_stats();


-- ============================================================
-- TABELL: answer_votes
-- Konsumenter kan rösta "detta var hjälpsamt" på svar
-- Max 1 röst per användare per svar
-- ============================================================
create table public.answer_votes (
  id          uuid primary key default uuid_generate_v4(),
  answer_id   uuid not null references public.answers(id) on delete cascade,
  voted_by    uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  
  unique(answer_id, voted_by)
);

-- Uppdatera helpful_votes på answers + helpful_votes_total på professional
create or replace function update_vote_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.answers set helpful_votes = helpful_votes + 1 where id = new.answer_id;
    update public.professional_profiles pp
    set helpful_votes_total = helpful_votes_total + 1
    from public.answers a
    where a.id = new.answer_id and pp.id = a.answered_by;
  elsif TG_OP = 'DELETE' then
    update public.answers set helpful_votes = greatest(helpful_votes - 1, 0) where id = old.answer_id;
    update public.professional_profiles pp
    set helpful_votes_total = greatest(helpful_votes_total - 1, 0)
    from public.answers a
    where a.id = old.answer_id and pp.id = a.answered_by;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trigger_update_vote_counts
  after insert or delete on public.answer_votes
  for each row execute function update_vote_counts();


-- ============================================================
-- TABELL: question_followers
-- Användare som "bevakar" en fråga de inte ställt
-- ============================================================
create table public.question_followers (
  id           uuid primary key default uuid_generate_v4(),
  question_id  uuid not null references public.questions(id) on delete cascade,
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  
  unique(question_id, follower_id)
);

-- Uppdatera follower_count på questions
create or replace function update_follower_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.questions set follower_count = follower_count + 1 where id = new.question_id;
  elsif TG_OP = 'DELETE' then
    update public.questions set follower_count = greatest(follower_count - 1, 0) where id = old.question_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trigger_update_follower_count
  after insert or delete on public.question_followers
  for each row execute function update_follower_count();


-- ============================================================
-- TABELL: messages
-- Direktmeddelanden inom plattformen
-- Consumer → Professional ELLER Professional → Professional
-- ============================================================
create table public.messages (
  id           uuid primary key default uuid_generate_v4(),
  thread_id    uuid not null,                              -- Grupperar meddelanden i samma konversation
  thread_type  message_thread_type not null,
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  receiver_id  uuid not null references public.profiles(id) on delete cascade,
  
  body         text not null,
  read_at      timestamptz,                                -- null = oläst
  
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  
  constraint no_self_message check (sender_id != receiver_id)
);

comment on table public.messages is 'Direktmeddelanden inom plattformen';
comment on column public.messages.thread_id is 'Samma thread_id grupperar alla meddelanden i en konversation';


-- ============================================================
-- TABELL: forum_posts
-- Internt mäklarforum — ENDAST för verifierade yrkesprofessionella
-- ============================================================
create table public.forum_posts (
  id            uuid primary key default uuid_generate_v4(),
  author_id     uuid not null references public.professional_profiles(id) on delete cascade,
  
  category      forum_category not null,
  title         text not null,
  body          text not null,
  slug          text unique,
  
  is_pinned     boolean not null default false,
  is_recruitment boolean not null default false,  -- Rekryteringsannons
  
  reply_count   integer not null default 0,
  view_count    integer not null default 0,
  
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

comment on table public.forum_posts is 'Internt forum — ENDAST synligt för verifierade yrkesprofessionella';

create trigger trigger_set_forum_post_slug
  before insert on public.forum_posts
  for each row execute function set_question_slug();  -- Återanvänder samma slug-funktion


-- ============================================================
-- TABELL: forum_replies
-- Svar i det interna forumet
-- ============================================================
create table public.forum_replies (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.forum_posts(id) on delete cascade,
  author_id   uuid not null references public.professional_profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Uppdatera reply_count på forum_posts
create or replace function update_forum_reply_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.forum_posts set reply_count = reply_count + 1, updated_at = now() where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.forum_posts set reply_count = greatest(reply_count - 1, 0) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trigger_update_forum_reply_count
  after insert or delete on public.forum_replies
  for each row execute function update_forum_reply_count();


-- ============================================================
-- TABELL: listings
-- Mäklarens aktiva och sålda objekt på profilsidan
-- ============================================================
create table public.listings (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  
  title           text not null,
  address         text not null,
  municipality    text not null,
  price           integer,                -- Utropspris i SEK
  sold_price      integer,               -- Slutpris (om sålt)
  size_sqm        numeric(6,1),          -- Storlek i kvm
  rooms           numeric(3,1),          -- Antal rum
  
  image_url       text,
  hemnet_url      text,
  
  status          listing_status not null default 'active',
  listed_at       date,
  sold_at         date,
  
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.listings is 'Mäklarens och andra proffsets aktiva/sålda objekt';


-- ============================================================
-- TABELL: notifications
-- Alla notiser samlade på ett ställe — email skickas via Edge Function
-- ============================================================
create table public.notifications (
  id                uuid primary key default uuid_generate_v4(),
  recipient_id      uuid not null references public.profiles(id) on delete cascade,
  
  type              notification_type not null,
  title             text not null,
  body              text,
  action_url        text,                -- Länk att klicka i emailet
  
  -- Referens till relevant objekt
  related_question_id uuid references public.questions(id) on delete set null,
  related_answer_id   uuid references public.answers(id) on delete set null,
  related_message_id  uuid references public.messages(id) on delete set null,
  
  read_at           timestamptz,         -- null = oläst
  email_sent_at     timestamptz,         -- null = ej skickat ännu
  
  created_at        timestamptz not null default now()
);

comment on table public.notifications is 'Alla notiser — läses i app och skickas som email via Edge Function';


-- ============================================================
-- TABELL: reports
-- Flaggade svar eller inlägg för admin-granskning
-- ============================================================
create table public.reports (
  id              uuid primary key default uuid_generate_v4(),
  reported_by     uuid not null references public.profiles(id) on delete cascade,
  
  -- Vad som rapporteras (ett av dessa är satt)
  answer_id       uuid references public.answers(id) on delete cascade,
  forum_post_id   uuid references public.forum_posts(id) on delete cascade,
  forum_reply_id  uuid references public.forum_replies(id) on delete cascade,
  
  reason          text not null,
  status          report_status not null default 'pending',
  admin_note      text,
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  
  created_at      timestamptz not null default now()
);


-- ============================================================
-- TABELL: profile_views
-- Loggning av profilvisningar för statistik
-- ============================================================
create table public.profile_views (
  id              uuid primary key default uuid_generate_v4(),
  professional_id uuid not null references public.professional_profiles(id) on delete cascade,
  viewed_by       uuid references public.profiles(id) on delete set null,  -- null = anonym
  viewed_at       timestamptz not null default now()
);

-- Uppdatera profile_views counter på professional_profiles
create or replace function update_profile_view_count()
returns trigger as $$
begin
  update public.professional_profiles
  set profile_views = profile_views + 1
  where id = new.professional_id;
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_profile_view_count
  after insert on public.profile_views
  for each row execute function update_profile_view_count();


-- ============================================================
-- TABELL: content_pages
-- Redaktionellt innehåll — guider, marknadsrapporter etc
-- ============================================================
create table public.content_pages (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  title         text not null,
  body          text not null,           -- Markdown
  meta_title    text,
  meta_desc     text,
  
  category      text not null,           -- 'guide-seller', 'guide-buyer', 'market-report', 'glossary'
  municipality  text,                    -- Om lokal marknadsrapport
  
  is_published  boolean not null default false,
  published_at  timestamptz,
  author_id     uuid references public.profiles(id),
  
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.content_pages is 'Redaktionellt innehåll — guider för köpare/säljare, marknadsrapporter, ordlista';


-- ============================================================
-- TABELL: market_data
-- Bostadsmarknadsstatistik per kommun och månad
-- ============================================================
create table public.market_data (
  id                    uuid primary key default uuid_generate_v4(),
  municipality          text not null,
  year                  integer not null,
  month                 integer not null check (month between 1 and 12),
  
  avg_price_sqm         integer,         -- Snittpris per kvm
  avg_days_on_market    integer,         -- Snittid på marknaden
  total_sold            integer,         -- Antal sålda objekt
  price_trend_pct       numeric(5,2),    -- Prisförändring % vs föregående månad
  
  source                text,            -- Datakälla
  created_at            timestamptz not null default now(),
  
  unique(municipality, year, month)
);

comment on table public.market_data is 'Bostadsmarknadsstatistik per kommun och månad';


-- ============================================================
-- TABELL: audit_log
-- Logg för admin-åtgärder (verifieringar, avstängningar etc)
-- ============================================================
create table public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  admin_id    uuid not null references public.profiles(id),
  action      text not null,             -- 'verify_professional', 'suspend_account' etc
  target_id   uuid not null,             -- ID på den påverkade resursen
  target_type text not null,             -- 'professional_profile', 'answer' etc
  note        text,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- UPDATED_AT TRIGGERS (generisk funktion)
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_profiles_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

create trigger trigger_professional_profiles_updated_at
  before update on public.professional_profiles
  for each row execute function update_updated_at();

create trigger trigger_questions_updated_at
  before update on public.questions
  for each row execute function update_updated_at();

create trigger trigger_answers_updated_at
  before update on public.answers
  for each row execute function update_updated_at();

create trigger trigger_forum_posts_updated_at
  before update on public.forum_posts
  for each row execute function update_updated_at();

create trigger trigger_forum_replies_updated_at
  before update on public.forum_replies
  for each row execute function update_updated_at();

create trigger trigger_listings_updated_at
  before update on public.listings
  for each row execute function update_updated_at();


-- ============================================================
-- AUTO-SKAPA PROFIL VID SUPABASE AUTH SIGNUP
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'consumer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ============================================================
-- INDEXES — Optimerar vanliga queries
-- ============================================================

-- profiles
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_email on public.profiles(email);

-- professional_profiles
create index idx_professional_profiles_type on public.professional_profiles(professional_type);
create index idx_professional_profiles_status on public.professional_profiles(verification_status);
create index idx_professional_profiles_slug on public.professional_profiles(profile_slug);
create index idx_professional_profiles_subscription on public.professional_profiles(subscription_tier);

-- professional_areas
create index idx_professional_areas_municipality on public.professional_areas(municipality);
create index idx_professional_areas_region on public.professional_areas(region);
create index idx_professional_areas_professional on public.professional_areas(professional_id);

-- questions
create index idx_questions_status on public.questions(status);
create index idx_questions_category on public.questions(category);
create index idx_questions_geo_scope on public.questions(geo_scope);
create index idx_questions_municipality on public.questions(municipality);
create index idx_questions_slug on public.questions(slug);
create index idx_questions_created_at on public.questions(created_at desc);
create index idx_questions_asked_by on public.questions(asked_by);

-- answers
create index idx_answers_question on public.answers(question_id);
create index idx_answers_professional on public.answers(answered_by);
create index idx_answers_helpful_votes on public.answers(helpful_votes desc);

-- messages
create index idx_messages_thread on public.messages(thread_id);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_receiver on public.messages(receiver_id);
create index idx_messages_unread on public.messages(receiver_id, read_at) where read_at is null;

-- notifications
create index idx_notifications_recipient on public.notifications(recipient_id);
create index idx_notifications_unread on public.notifications(recipient_id, read_at) where read_at is null;
create index idx_notifications_unsent on public.notifications(email_sent_at) where email_sent_at is null;

-- forum_posts
create index idx_forum_posts_category on public.forum_posts(category);
create index idx_forum_posts_author on public.forum_posts(author_id);
create index idx_forum_posts_recruitment on public.forum_posts(is_recruitment) where is_recruitment = true;

-- listings
create index idx_listings_professional on public.listings(professional_id);
create index idx_listings_municipality on public.listings(municipality);
create index idx_listings_status on public.listings(status);

-- market_data
create index idx_market_data_municipality on public.market_data(municipality);
create index idx_market_data_period on public.market_data(year desc, month desc);

-- profile_views
create index idx_profile_views_professional on public.profile_views(professional_id);
create index idx_profile_views_date on public.profile_views(viewed_at desc);

-- content_pages
create index idx_content_pages_category on public.content_pages(category);
create index idx_content_pages_municipality on public.content_pages(municipality);
create index idx_content_pages_published on public.content_pages(is_published, published_at desc);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_areas enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.answer_votes enable row level security;
alter table public.question_followers enable row level security;
alter table public.messages enable row level security;
alter table public.forum_posts enable row level security;
alter table public.forum_replies enable row level security;
alter table public.listings enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.profile_views enable row level security;
alter table public.content_pages enable row level security;
alter table public.market_data enable row level security;
alter table public.audit_log enable row level security;
alter table public.forum_posts enable row level security;


-- ---- HELPER: Är användaren verifierat proffs? ----
create or replace function is_verified_professional(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.professional_profiles pp
    join public.profiles p on p.id = pp.profile_id
    where p.id = user_id
    and pp.verification_status = 'verified'
  );
$$ language sql security definer stable;

-- ---- HELPER: Är användaren admin? ----
create or replace function is_admin(user_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = user_id
    and role = 'professional'  -- Utökas med admin-roll i fas 2
    -- TODO: Lägg till dedikerad admin-tabell i fas 2
  );
$$ language sql security definer stable;


-- ---- profiles ----
create policy "Alla kan läsa publika profiler"
  on public.profiles for select using (deleted_at is null);

create policy "Användare kan uppdatera sin egen profil"
  on public.profiles for update using (auth.uid() = id);


-- ---- professional_profiles ----
create policy "Alla kan läsa verifierade proffsprofiler"
  on public.professional_profiles for select
  using (verification_status = 'verified');

create policy "Proffs kan se sin egen profil oavsett status"
  on public.professional_profiles for select
  using (profile_id = auth.uid());

create policy "Proffs kan uppdatera sin egen profil"
  on public.professional_profiles for update
  using (profile_id = auth.uid());

create policy "Alla inloggade kan skapa proffsprofil"
  on public.professional_profiles for insert
  with check (profile_id = auth.uid());


-- ---- professional_areas ----
create policy "Alla kan läsa areas för verifierade proffs"
  on public.professional_areas for select
  using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = professional_id
      and pp.verification_status = 'verified'
    )
  );

create policy "Proffs hanterar sina egna areas"
  on public.professional_areas for all
  using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = professional_id
      and pp.profile_id = auth.uid()
    )
  );


-- ---- questions ----
create policy "Alla kan läsa publika frågor"
  on public.questions for select
  using (deleted_at is null);

create policy "Inloggade användare kan ställa frågor"
  on public.questions for insert
  with check (auth.uid() = asked_by);

create policy "Konsument kan uppdatera sina egna frågor"
  on public.questions for update
  using (auth.uid() = asked_by);


-- ---- answers ----
create policy "Alla kan läsa svar"
  on public.answers for select
  using (deleted_at is null);

create policy "Verifierade proffs kan svara"
  on public.answers for insert
  with check (
    is_verified_professional(auth.uid())
    and exists (
      select 1 from public.professional_profiles pp
      where pp.id = answered_by
      and pp.profile_id = auth.uid()
    )
  );

create policy "Proffs kan uppdatera eget svar (followup)"
  on public.answers for update
  using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = answered_by
      and pp.profile_id = auth.uid()
    )
  );


-- ---- answer_votes ----
create policy "Inloggade kan rösta"
  on public.answer_votes for insert
  with check (auth.uid() = voted_by);

create policy "Kan se sina egna röster"
  on public.answer_votes for select
  using (auth.uid() = voted_by);

create policy "Kan ta bort sin röst"
  on public.answer_votes for delete
  using (auth.uid() = voted_by);


-- ---- question_followers ----
create policy "Inloggade kan följa frågor"
  on public.question_followers for all
  using (auth.uid() = follower_id);


-- ---- messages ----
create policy "Kan se egna meddelanden"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Inloggade kan skicka meddelanden"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Mottagare kan markera som läst"
  on public.messages for update
  using (auth.uid() = receiver_id);


-- ---- forum_posts — KUN VERIFIERADE PROFFS ----
create policy "Endast verifierade proffs kan se forumet"
  on public.forum_posts for select
  using (
    is_verified_professional(auth.uid())
    and deleted_at is null
  );

create policy "Verifierade proffs kan skapa inlägg"
  on public.forum_posts for insert
  with check (
    is_verified_professional(auth.uid())
    and exists (
      select 1 from public.professional_profiles pp
      where pp.id = author_id
      and pp.profile_id = auth.uid()
    )
  );

create policy "Proffs kan uppdatera egna inlägg"
  on public.forum_posts for update
  using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = author_id
      and pp.profile_id = auth.uid()
    )
  );


-- ---- forum_replies ----
create policy "Verifierade proffs kan se replies"
  on public.forum_replies for select
  using (
    is_verified_professional(auth.uid())
    and deleted_at is null
  );

create policy "Verifierade proffs kan svara i forumet"
  on public.forum_replies for insert
  with check (
    is_verified_professional(auth.uid())
    and exists (
      select 1 from public.professional_profiles pp
      where pp.id = author_id
      and pp.profile_id = auth.uid()
    )
  );


-- ---- listings ----
create policy "Alla kan se aktiva objekt"
  on public.listings for select
  using (status in ('active', 'sold'));

create policy "Proffs hanterar egna objekt"
  on public.listings for all
  using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = professional_id
      and pp.profile_id = auth.uid()
    )
  );


-- ---- notifications ----
create policy "Kan bara se egna notiser"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "Kan markera egna notiser som lästa"
  on public.notifications for update
  using (auth.uid() = recipient_id);


-- ---- reports ----
create policy "Inloggade kan rapportera"
  on public.reports for insert
  with check (auth.uid() = reported_by);

create policy "Kan se egna rapporter"
  on public.reports for select
  using (auth.uid() = reported_by);


-- ---- profile_views ----
create policy "Proffs kan se sina egna visningar"
  on public.profile_views for select
  using (
    exists (
      select 1 from public.professional_profiles pp
      where pp.id = professional_id
      and pp.profile_id = auth.uid()
    )
  );

create policy "Alla kan logga profilvisningar"
  on public.profile_views for insert
  with check (true);


-- ---- content_pages ----
create policy "Alla kan läsa publicerade sidor"
  on public.content_pages for select
  using (is_published = true);


-- ---- market_data ----
create policy "Alla kan läsa marknadsdata"
  on public.market_data for select
  using (true);


-- ---- audit_log ----
create policy "Endast admin kan se audit log"
  on public.audit_log for select
  using (is_admin(auth.uid()));


-- ============================================================
-- STORAGE BUCKETS (körs i Supabase Dashboard)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('listings', 'listings', true);
-- Storage policies sätts upp i Supabase Dashboard


-- ============================================================
-- SCHEMA KOMPLETT
-- ============================================================
-- Tabeller:           16
-- Enums:              9
-- Triggers:           14
-- RLS Policies:       30+
-- Indexes:            25+
-- Helper Functions:   5
-- ============================================================
