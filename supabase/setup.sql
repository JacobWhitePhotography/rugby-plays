-- Rugby Plays: database setup for Supabase
-- Run this once in your Supabase project: SQL Editor -> New query -> paste all of this -> Run.
--
-- BEFORE YOU RUN IT: change the coach PIN on the line marked  >>> COACH PIN <<<  below.
-- Use at least 6 characters. You can change it later from inside the app.

create extension if not exists pgcrypto with schema extensions;

-- ---------- Tables ----------

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  coach_pin_hash text not null
);

create table if not exists public.squad (
  id text primary key,
  num int not null,
  name text not null check (char_length(name) <= 40),
  pos text not null check (char_length(pos) <= 40)
);

create table if not exists public.plays (
  id text primary key default gen_random_uuid()::text,
  title text not null check (char_length(title) <= 80),
  cat text not null check (char_length(cat) <= 20),
  call_name text not null default '' check (char_length(call_name) <= 40),
  tokens jsonb not null,
  steps jsonb not null check (pg_column_size(steps) < 200000),
  source text not null default 'coach',
  suggested_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.suggestions (
  id text primary key default gen_random_uuid()::text,
  title text not null check (char_length(title) between 1 and 80),
  cat text not null check (char_length(cat) <= 20),
  call_name text not null default '' check (char_length(call_name) <= 40),
  tokens jsonb not null check (pg_column_size(tokens) < 5000),
  steps jsonb not null check (pg_column_size(steps) < 200000),
  suggested_by text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  play_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.views (
  play_id text not null references public.plays(id) on delete cascade,
  player_id text not null references public.squad(id) on delete cascade,
  watched_at timestamptz not null default now(),
  primary key (play_id, player_id)
);

-- ---------- Who can do what ----------
-- Everyone with the link can READ plays, squad, suggestions and who has watched what.
-- Everyone can ADD a suggestion (always as "pending") and mark a play as watched.
-- Only the coach (with the PIN) can change plays, the squad, or approve suggestions.
-- That goes through the coach_* functions further down, which check the PIN on the server.

alter table public.settings enable row level security;
alter table public.squad enable row level security;
alter table public.plays enable row level security;
alter table public.suggestions enable row level security;
alter table public.views enable row level security;

revoke all on public.settings from anon, authenticated;
grant select on public.squad, public.plays, public.suggestions, public.views to anon, authenticated;
grant insert on public.suggestions, public.views to anon, authenticated;

drop policy if exists "read squad" on public.squad;
create policy "read squad" on public.squad for select to anon, authenticated using (true);
drop policy if exists "read plays" on public.plays;
create policy "read plays" on public.plays for select to anon, authenticated using (true);
drop policy if exists "read suggestions" on public.suggestions;
create policy "read suggestions" on public.suggestions for select to anon, authenticated using (true);
drop policy if exists "add suggestion" on public.suggestions;
create policy "add suggestion" on public.suggestions for insert to anon, authenticated
  with check (status = 'pending' and play_id is null);
drop policy if exists "read views" on public.views;
create policy "read views" on public.views for select to anon, authenticated using (true);
drop policy if exists "mark watched" on public.views;
create policy "mark watched" on public.views for insert to anon, authenticated with check (true);

-- ---------- Coach functions (PIN checked on the server) ----------

create or replace function public.require_coach(p_pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_pin is null or not exists (
    select 1 from public.settings where coach_pin_hash = extensions.crypt(p_pin, coach_pin_hash)
  ) then
    perform pg_sleep(1);  -- slows down anyone guessing PINs
    raise exception 'wrong_pin';
  end if;
end $$;
revoke execute on function public.require_coach(text) from public, anon, authenticated;

create or replace function public.coach_login(p_pin text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.require_coach(p_pin);
  return true;
end $$;

create or replace function public.coach_save_play(
  p_pin text, p_id text, p_title text, p_cat text, p_call text,
  p_tokens jsonb, p_steps jsonb, p_source text default 'coach', p_by text default null
) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_id text := coalesce(nullif(p_id, ''), gen_random_uuid()::text);
begin
  perform public.require_coach(p_pin);
  insert into public.plays (id, title, cat, call_name, tokens, steps, source, suggested_by, updated_at)
  values (v_id, left(p_title, 80), left(p_cat, 20), left(coalesce(p_call, ''), 40), p_tokens, p_steps,
          coalesce(p_source, 'coach'), p_by, now())
  on conflict (id) do update set
    title = excluded.title, cat = excluded.cat, call_name = excluded.call_name,
    tokens = excluded.tokens, steps = excluded.steps, updated_at = now();
  return v_id;
end $$;

create or replace function public.coach_delete_play(p_pin text, p_id text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.require_coach(p_pin);
  delete from public.plays where id = p_id;
end $$;

create or replace function public.coach_approve(p_pin text, p_id text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_id text := gen_random_uuid()::text;
begin
  perform public.require_coach(p_pin);
  insert into public.plays (id, title, cat, call_name, tokens, steps, source, suggested_by)
  select v_id, title, cat, call_name, tokens, steps, 'suggestion', suggested_by
  from public.suggestions where id = p_id;
  if not found then raise exception 'Suggestion not found'; end if;
  update public.suggestions set status = 'approved', play_id = v_id where id = p_id;
  return v_id;
end $$;

create or replace function public.coach_review(p_pin text, p_id text, p_status text, p_play_id text default null)
returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.require_coach(p_pin);
  if p_status not in ('pending', 'approved', 'declined') then raise exception 'Bad status'; end if;
  update public.suggestions set status = p_status, play_id = p_play_id where id = p_id;
end $$;

create or replace function public.coach_delete_suggestion(p_pin text, p_id text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.require_coach(p_pin);
  delete from public.suggestions where id = p_id;
end $$;

create or replace function public.coach_save_squad(p_pin text, p_players jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.require_coach(p_pin);
  insert into public.squad (id, num, name, pos)
  select x->>'id', (x->>'num')::int, left(x->>'name', 40), left(x->>'pos', 40)
  from jsonb_array_elements(p_players) as x
  on conflict (id) do update set num = excluded.num, name = excluded.name, pos = excluded.pos;
end $$;

create or replace function public.coach_change_pin(p_pin text, p_new_pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.require_coach(p_pin);
  if p_new_pin is null or char_length(p_new_pin) < 4 then raise exception 'PIN must be at least 4 characters'; end if;
  update public.settings set coach_pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf')) where id = 1;
end $$;

grant execute on function
  public.coach_login(text),
  public.coach_save_play(text, text, text, text, text, jsonb, jsonb, text, text),
  public.coach_delete_play(text, text),
  public.coach_approve(text, text),
  public.coach_review(text, text, text, text),
  public.coach_delete_suggestion(text, text),
  public.coach_save_squad(text, jsonb),
  public.coach_change_pin(text, text)
to anon, authenticated;

-- ---------- Starting data ----------

-- >>> COACH PIN <<<  Replace 'change-me-123' with your own PIN before running.
insert into public.settings (id, coach_pin_hash)
values (1, extensions.crypt('change-me-123', extensions.gen_salt('bf')))
on conflict (id) do nothing;

-- 23 placeholder players. Rename them in the app (Squad tab, as coach).
insert into public.squad (id, num, name, pos) values
  ('p1', 1, 'Player 1', 'Loosehead prop'), ('p2', 2, 'Player 2', 'Hooker'),
  ('p3', 3, 'Player 3', 'Tighthead prop'), ('p4', 4, 'Player 4', 'Lock'),
  ('p5', 5, 'Player 5', 'Lock'), ('p6', 6, 'Player 6', 'Blindside flanker'),
  ('p7', 7, 'Player 7', 'Openside flanker'), ('p8', 8, 'Player 8', 'Number 8'),
  ('p9', 9, 'Player 9', 'Scrum-half'), ('p10', 10, 'Player 10', 'Fly-half'),
  ('p11', 11, 'Player 11', 'Left wing'), ('p12', 12, 'Player 12', 'Inside centre'),
  ('p13', 13, 'Player 13', 'Outside centre'), ('p14', 14, 'Player 14', 'Right wing'),
  ('p15', 15, 'Player 15', 'Full-back'), ('p16', 16, 'Player 16', 'Replacement'),
  ('p17', 17, 'Player 17', 'Replacement'), ('p18', 18, 'Player 18', 'Replacement'),
  ('p19', 19, 'Player 19', 'Replacement'), ('p20', 20, 'Player 20', 'Replacement'),
  ('p21', 21, 'Player 21', 'Replacement'), ('p22', 22, 'Player 22', 'Replacement'),
  ('p23', 23, 'Player 23', 'Replacement')
on conflict (id) do nothing;
