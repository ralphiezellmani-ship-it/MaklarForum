-- Run this once after your account is created.
-- Replace with your real login email.

update profiles
set role = 'admin', verification_status = 'verified'
where email = 'din-email@doman.se';
