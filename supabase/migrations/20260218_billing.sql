do $$
begin
  if not exists (select 1 from pg_type where typname = 'processing_status') then
    create type processing_status as enum ('pending', 'processed', 'failed');
  end if;
end
$$;

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  status processing_status not null default 'processed',
  created_at timestamptz not null default now()
);

create table if not exists fortnox_sync_queue (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  reference_id text not null,
  payload jsonb not null,
  status processing_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table billing_events enable row level security;
alter table fortnox_sync_queue enable row level security;

create policy "billing events admin read" on billing_events
for select using (is_admin(auth.uid()));

create policy "fortnox queue admin read" on fortnox_sync_queue
for select using (is_admin(auth.uid()));
