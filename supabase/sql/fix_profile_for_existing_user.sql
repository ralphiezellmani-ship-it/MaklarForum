-- Run this manually if a user signed up in auth.users but does not have a row in profiles.
-- Replace DIN_EPOST first.

insert into profiles (id, role, full_name, email, verification_status, accepted_terms_at)
select
  u.id,
  'consumer',
  coalesce(u.raw_user_meta_data->>'full_name', 'Anvandare'),
  u.email,
  'verified',
  now()
from auth.users u
where u.email = 'DIN_EPOST'
on conflict (id) do update
set email = excluded.email;
