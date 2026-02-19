-- Allow recipients to mark their own incoming messages as read.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'messages receiver update read'
  ) then
    create policy "messages receiver update read"
      on messages
      for update
      using (receiver_id = auth.uid())
      with check (receiver_id = auth.uid());
  end if;
end
$$;
