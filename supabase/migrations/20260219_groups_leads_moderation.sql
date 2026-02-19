-- Agent groups, lead/tip dispatch logs and moderation queue.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'group_status') then
    create type group_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'group_member_role') then
    create type group_member_role as enum ('owner', 'member');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'moderation_item_type') then
    create type moderation_item_type as enum ('answer');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'moderation_status') then
    create type moderation_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_dispatch_type') then
    create type lead_dispatch_type as enum ('tip', 'lead');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_dispatch_status') then
    create type lead_dispatch_status as enum ('queued', 'sent', 'failed');
  end if;
end
$$;

create table if not exists agent_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  municipality text,
  region text,
  status group_status not null default 'pending',
  created_by uuid not null references profiles(id) on delete cascade,
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_group_members (
  group_id uuid not null references agent_groups(id) on delete cascade,
  agent_id uuid not null references profiles(id) on delete cascade,
  role group_member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (group_id, agent_id)
);

create table if not exists moderation_queue (
  id uuid primary key default gen_random_uuid(),
  item_type moderation_item_type not null,
  question_id uuid references questions(id) on delete cascade,
  proposed_by uuid not null references profiles(id) on delete cascade,
  body text not null,
  blocked_terms text[] not null default '{}',
  status moderation_status not null default 'pending',
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists lead_dispatch_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references profiles(id) on delete cascade,
  question_id uuid references questions(id) on delete set null,
  dispatch_type lead_dispatch_type not null,
  status lead_dispatch_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  dispatched_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_groups_status on agent_groups(status);
create index if not exists idx_agent_groups_geo on agent_groups(region, municipality);
create index if not exists idx_agent_group_members_agent on agent_group_members(agent_id);
create index if not exists idx_moderation_queue_status on moderation_queue(status, created_at);
create index if not exists idx_lead_dispatch_logs_agent on lead_dispatch_logs(agent_id, created_at desc);

alter table agent_groups enable row level security;
alter table agent_group_members enable row level security;
alter table moderation_queue enable row level security;
alter table lead_dispatch_logs enable row level security;

create policy "agent groups approved read" on agent_groups
for select using (
  status = 'approved'
  or created_by = auth.uid()
  or is_admin(auth.uid())
);

create policy "agent groups create" on agent_groups
for insert with check (
  created_by = auth.uid()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and (p.role = 'agent' or p.role = 'admin')
  )
);

create policy "agent groups owner update pending" on agent_groups
for update using (created_by = auth.uid() and status = 'pending')
with check (created_by = auth.uid() and status = 'pending');

create policy "agent groups admin update" on agent_groups
for update using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy "agent group members read" on agent_group_members
for select using (
  agent_id = auth.uid()
  or exists (
    select 1 from agent_groups g
    where g.id = group_id and (g.status = 'approved' or g.created_by = auth.uid())
  )
  or is_admin(auth.uid())
);

create policy "agent group members join" on agent_group_members
for insert with check (
  agent_id = auth.uid()
  and exists (
    select 1
    from agent_groups g
    join profiles p on p.id = auth.uid()
    where g.id = group_id
      and (g.status = 'approved' or g.created_by = auth.uid())
      and (p.role = 'agent' or p.role = 'admin')
  )
);

create policy "agent group members leave" on agent_group_members
for delete using (agent_id = auth.uid() or is_admin(auth.uid()));

create policy "moderation queue insert by agent" on moderation_queue
for insert with check (
  proposed_by = auth.uid()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'agent'
  )
);

create policy "moderation queue admin read" on moderation_queue
for select using (is_admin(auth.uid()));

create policy "moderation queue admin update" on moderation_queue
for update using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));

create policy "lead dispatch logs own read" on lead_dispatch_logs
for select using (agent_id = auth.uid() or is_admin(auth.uid()));

create policy "lead dispatch logs own insert" on lead_dispatch_logs
for insert with check (agent_id = auth.uid() or is_admin(auth.uid()));
