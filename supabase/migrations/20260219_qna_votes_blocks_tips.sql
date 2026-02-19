-- Q&A voting, consumer-to-agent messaging guardrails, and agent tips.

create table if not exists answer_votes (
  answer_id uuid not null references answers(id) on delete cascade,
  consumer_id uuid not null references profiles(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (answer_id, consumer_id)
);

create table if not exists user_blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists agent_tips (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  audience audience_type not null default 'general',
  geo_scope geo_scope not null default 'open',
  municipality text,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_tip_votes (
  tip_id uuid not null references agent_tips(id) on delete cascade,
  consumer_id uuid not null references profiles(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tip_id, consumer_id)
);

create index if not exists idx_answer_votes_answer on answer_votes(answer_id);
create index if not exists idx_answer_votes_consumer on answer_votes(consumer_id);
create index if not exists idx_user_blocks_blocked on user_blocks(blocked_id);
create index if not exists idx_agent_tips_geo on agent_tips(geo_scope, region, municipality);
create index if not exists idx_agent_tips_author on agent_tips(author_id, created_at desc);
create index if not exists idx_agent_tip_votes_tip on agent_tip_votes(tip_id);

alter table answer_votes enable row level security;
alter table user_blocks enable row level security;
alter table agent_tips enable row level security;
alter table agent_tip_votes enable row level security;

create policy "answer votes public read" on answer_votes
for select using (true);

create policy "answer votes consumer insert" on answer_votes
for insert with check (
  consumer_id = auth.uid()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'consumer'
  )
);

create policy "answer votes consumer update" on answer_votes
for update using (consumer_id = auth.uid())
with check (consumer_id = auth.uid());

create policy "answer votes consumer delete" on answer_votes
for delete using (consumer_id = auth.uid());

create policy "user blocks own read" on user_blocks
for select using (blocker_id = auth.uid() or blocked_id = auth.uid() or is_admin(auth.uid()));

create policy "user blocks consumer insert" on user_blocks
for insert with check (
  blocker_id = auth.uid()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'consumer'
  )
);

create policy "user blocks consumer delete" on user_blocks
for delete using (blocker_id = auth.uid() or is_admin(auth.uid()));

create policy "agent tips public read" on agent_tips
for select using (true);

create policy "agent tips verified agent insert" on agent_tips
for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'agent' and p.verification_status = 'verified'
  )
);

create policy "agent tips author update" on agent_tips
for update using (author_id = auth.uid() or is_admin(auth.uid()))
with check (author_id = auth.uid() or is_admin(auth.uid()));

create policy "agent tips author delete" on agent_tips
for delete using (author_id = auth.uid() or is_admin(auth.uid()));

create policy "agent tip votes public read" on agent_tip_votes
for select using (true);

create policy "agent tip votes consumer insert" on agent_tip_votes
for insert with check (
  consumer_id = auth.uid()
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'consumer'
  )
);

create policy "agent tip votes consumer update" on agent_tip_votes
for update using (consumer_id = auth.uid())
with check (consumer_id = auth.uid());

create policy "agent tip votes consumer delete" on agent_tip_votes
for delete using (consumer_id = auth.uid());
