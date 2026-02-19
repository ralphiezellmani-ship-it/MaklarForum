-- Policies for watcher and message engagement features.

alter table question_watchers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'question_watchers' and policyname = 'watchers self select'
  ) then
    create policy "watchers self select"
      on question_watchers
      for select
      using (user_id = auth.uid() or is_admin(auth.uid()));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'question_watchers' and policyname = 'watchers self insert'
  ) then
    create policy "watchers self insert"
      on question_watchers
      for insert
      with check (user_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'question_watchers' and policyname = 'watchers self delete'
  ) then
    create policy "watchers self delete"
      on question_watchers
      for delete
      using (user_id = auth.uid());
  end if;
end
$$;
