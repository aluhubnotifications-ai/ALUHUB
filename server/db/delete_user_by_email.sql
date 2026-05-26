-- ════════════════════════════════════════════════════════════════════
--  Delete an ALUHub account so its email can be re-used to sign up.
--
--  WHY THIS EXISTS
--  Since the custom-auth migration, login credentials live in
--  public.app_users — NOT in Supabase's built-in auth.users. Deleting
--  a user from the Supabase Dashboard ("Authentication → Users") only
--  empties auth.users; the row in app_users stays, so the /register
--  endpoint keeps returning 409 "An account with that email already
--  exists".
--
--  HOW TO USE
--  1. Open Supabase Dashboard → SQL Editor.
--  2. Set the :email variable at the top to the address to wipe.
--  3. Run the whole script. It is idempotent — re-running with an
--     already-deleted email is a no-op.
-- ════════════════════════════════════════════════════════════════════

-- ▼▼▼ EDIT THIS ▼▼▼
\set target_email 'someone@alustudent.com'
-- ▲▲▲ EDIT THIS ▲▲▲

do $$
declare
  v_email text := lower(trim(:'target_email'));
  v_id    uuid;
begin
  select id into v_id
  from public.app_users
  where lower(email) = v_email;

  if v_id is null then
    raise notice 'No app_users row found for %', v_email;
  else
    raise notice 'Deleting app_users id=% (email=%)', v_id, v_email;

    -- Revoke any outstanding refresh tokens first.
    delete from public.auth_refresh_tokens where user_id = v_id;

    -- Profile row (FK to auth.users was already dropped by custom_auth.sql).
    delete from public.profiles where id = v_id;

    -- Finally, the user row itself.
    delete from public.app_users where id = v_id;

    raise notice 'Done — % can be used to register again.', v_email;
  end if;

  -- Also clear any legacy row in auth.users with the same address so
  -- the dashboard does not show a ghost account.
  delete from auth.users where lower(email) = v_email;
end $$;
