-- Create one test question from an existing consumer account.
-- Replace the email below with your real consumer login email.

with consumer as (
  select id
  from profiles
  where email = 'din-konsument-epost@domain.se'
    and role = 'consumer'
  limit 1
)
insert into questions (
  asked_by,
  title,
  question_slug,
  body,
  audience,
  category,
  geo_scope,
  municipality,
  region
)
select
  c.id,
  'Hur långt innan visning bör jag renovera badrummet?',
  'testfraga-renovera-badrum-' || to_char(now(), 'YYYYMMDDHH24MISS'),
  'Jag ska sälja i Täby under våren och undrar vad som är mest värdeskapande inför visning.',
  'seller',
  'vardering',
  'local',
  'Täby',
  'Stockholm'
from consumer c;
