-- GXLD ticket system schema for Supabase.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (uses if-not-exists / create-or-replace).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.tickets (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  name         text not null,
  discord      text not null,
  email        text,
  package_type text,
  budget       text,
  deadline     text,
  brief        text not null,
  status       text not null default 'Open',
  quote        text,
  admin_note   text default 'Thanks for opening a ticket. GXLD will review your brief and reply soon.',
  admin_note_at timestamptz default now(),
  delivery     jsonb,
  released_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.ticket_replies (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets(id) on delete cascade,
  from_role  text not null check (from_role in ('Client', 'GXLD')),
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_replies_ticket_id_idx on public.ticket_replies(ticket_id);

-- ---------------------------------------------------------------------------
-- Row level security
--   * Authenticated users (the owner) get full access. Keep public sign-ups
--     DISABLED in Supabase Auth settings so only your account can log in.
--   * Anonymous visitors get NO direct table access. They can only reach their
--     own ticket through the SECURITY DEFINER functions below (which require
--     knowing the exact ticket code).
-- ---------------------------------------------------------------------------
alter table public.tickets enable row level security;
alter table public.ticket_replies enable row level security;

drop policy if exists "owner full access tickets" on public.tickets;
create policy "owner full access tickets" on public.tickets
  for all to authenticated using (true) with check (true);

drop policy if exists "owner full access replies" on public.ticket_replies;
create policy "owner full access replies" on public.ticket_replies
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Unique ticket code generator (GX- + 8 hex chars ~ 4.3 billion combinations).
create or replace function public.gen_ticket_code()
returns text
language plpgsql
as $$
declare
  new_code text;
  hit int;
begin
  loop
    new_code := 'GX-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    select count(*) into hit from public.tickets where code = new_code;
    exit when hit = 0;
  end loop;
  return new_code;
end;
$$;

-- Return a ticket (with its replies) as a single JSON object, by code.
create or replace function public.ticket_json(p_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select to_jsonb(t) || jsonb_build_object(
    'replies',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('from_role', r.from_role, 'body', r.body, 'created_at', r.created_at)
          order by r.created_at
        )
        from public.ticket_replies r
        where r.ticket_id = t.id
      ),
      '[]'::jsonb
    )
  )
  from public.tickets t
  where t.code = p_code;
$$;

-- Create a ticket (called by anonymous visitors). Code is generated server-side.
create or replace function public.create_ticket(
  p_name text,
  p_discord text,
  p_email text,
  p_package text,
  p_budget text,
  p_deadline text,
  p_brief text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  insert into public.tickets(code, name, discord, email, package_type, budget, deadline, brief)
  values (gen_ticket_code(), p_name, p_discord, nullif(p_email, ''), p_package, p_budget, p_deadline, p_brief)
  returning code into v_code;
  return public.ticket_json(v_code);
end;
$$;

-- Look up a ticket by code (called by anonymous visitors).
create or replace function public.get_ticket(p_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.ticket_json(p_code);
$$;

-- Append a client reply to a ticket by code (called by anonymous visitors).
create or replace function public.add_client_reply(p_code text, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.tickets where code = p_code;
  if v_id is null then
    raise exception 'ticket not found';
  end if;
  insert into public.ticket_replies(ticket_id, from_role, body)
  values (v_id, 'Client', p_body);
  update public.tickets set updated_at = now() where id = v_id;
  return public.ticket_json(p_code);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: expose only the three client-facing functions to anonymous users.
-- ---------------------------------------------------------------------------
grant execute on function public.create_ticket(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_ticket(text) to anon, authenticated;
grant execute on function public.add_client_reply(text, text) to anon, authenticated;
