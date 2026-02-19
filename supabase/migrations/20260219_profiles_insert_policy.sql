-- Enables authenticated users to create their own profile row after signup.
-- This fixes cases where auth signup succeeds but profile upsert is blocked by RLS.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles self insert'
  ) then
    create policy "profiles self insert"
      on profiles
      for insert
      with check (id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles admin insert'
  ) then
    create policy "profiles admin insert"
      on profiles
      for insert
      with check (is_admin(auth.uid()));
  end if;
end
$$;
