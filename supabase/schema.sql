-- ============================================================================
-- THE ARENA — database schema
-- Run this once in your Supabase project's SQL Editor (Dashboard > SQL Editor
-- > New query > paste all of this > Run).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- USERS  (no passwords — just a nickname claimed on first visit)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  avatar_color text not null default '#7C5CFF',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CLAIMS  (root claims AND replies live in the same table — a reply is just
-- a claim with parent_claim_id set. This keeps voting/sorting/filtering
-- logic identical for both.)
-- ----------------------------------------------------------------------------
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  parent_claim_id uuid references public.claims(id) on delete cascade,

  -- which wizard produced this: 'comparative' | 'superlative' | 'assertion'
  claim_type text not null check (claim_type in ('comparative', 'superlative', 'assertion')),

  -- structured fields captured by the guided wizard (kept even though we
  -- also store a composed display_text, so the UI can show a "breakdown")
  subject_a text not null,
  subject_b text,
  direction text,              -- 'better' | 'worse' | 'best' | 'worst' | null for assertions
  dimension text not null,     -- the specific respect / criterion / predicate
  scope text not null,         -- who/what this applies to
  timeframe text,              -- optional temporal/conditional qualifier
  caveats jsonb not null default '[]'::jsonb,   -- array of strings

  -- reply-only fields (null for root claims)
  stance text check (stance in ('support', 'challenge', 'nuance')),
  addresses text,               -- which part of the parent this reply targets

  -- fun generated title + final canonical sentence
  arena_name text not null,
  display_text text not null,

  -- media
  media_url text,
  media_type text check (media_type in ('audio', 'video')),
  media_duration_seconds integer,

  -- denormalized counters, kept in sync by triggers below
  score integer not null default 0,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  reply_count integer not null default 0,
  reference_count integer not null default 0,
  view_count integer not null default 0,

  created_at timestamptz not null default now()
);

create index if not exists claims_parent_idx on public.claims (parent_claim_id);
create index if not exists claims_created_idx on public.claims (created_at desc);
create index if not exists claims_score_idx on public.claims (score desc);
create index if not exists claims_view_idx on public.claims (view_count desc);

-- ----------------------------------------------------------------------------
-- REFERENCES  (0..many links a claim can cite)
-- ----------------------------------------------------------------------------
create table if not exists public.claim_references (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists refs_claim_idx on public.claim_references (claim_id);

-- ----------------------------------------------------------------------------
-- VOTES  (one row per user per claim; value is +1 or -1; voting again with
-- the same value removes the vote, voting with the other value flips it)
-- ----------------------------------------------------------------------------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (claim_id, user_id)
);

-- ============================================================================
-- TRIGGERS — keep denormalized counters on `claims` in sync
-- ============================================================================

-- votes -> score / upvotes / downvotes
create or replace function public.recalc_claim_votes(p_claim_id uuid)
returns void language plpgsql as $$
begin
  update public.claims c
  set
    upvotes = coalesce((select count(*) from public.votes v where v.claim_id = p_claim_id and v.value = 1), 0),
    downvotes = coalesce((select count(*) from public.votes v where v.claim_id = p_claim_id and v.value = -1), 0),
    score = coalesce((select sum(v.value) from public.votes v where v.claim_id = p_claim_id), 0)
  where c.id = p_claim_id;
end;
$$;

create or replace function public.on_vote_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recalc_claim_votes(old.claim_id);
    return old;
  else
    perform public.recalc_claim_votes(new.claim_id);
    return new;
  end if;
end;
$$;

drop trigger if exists votes_after_change on public.votes;
create trigger votes_after_change
after insert or update or delete on public.votes
for each row execute function public.on_vote_change();

-- claim_references -> reference_count
create or replace function public.recalc_claim_reference_count(p_claim_id uuid)
returns void language plpgsql as $$
begin
  update public.claims set reference_count = (
    select count(*) from public.claim_references where claim_id = p_claim_id
  ) where id = p_claim_id;
end;
$$;

create or replace function public.on_reference_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recalc_claim_reference_count(old.claim_id);
    return old;
  else
    perform public.recalc_claim_reference_count(new.claim_id);
    return new;
  end if;
end;
$$;

drop trigger if exists refs_after_change on public.claim_references;
create trigger refs_after_change
after insert or delete on public.claim_references
for each row execute function public.on_reference_change();

-- replies -> parent reply_count
create or replace function public.recalc_parent_reply_count(p_parent_id uuid)
returns void language plpgsql as $$
begin
  if p_parent_id is null then
    return;
  end if;
  update public.claims set reply_count = (
    select count(*) from public.claims where parent_claim_id = p_parent_id
  ) where id = p_parent_id;
end;
$$;

create or replace function public.on_claim_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recalc_parent_reply_count(old.parent_claim_id);
    return old;
  else
    perform public.recalc_parent_reply_count(new.parent_claim_id);
    return new;
  end if;
end;
$$;

drop trigger if exists claims_after_change on public.claims;
create trigger claims_after_change
after insert or delete on public.claims
for each row execute function public.on_claim_change();

-- atomic view-count bump (avoids a read-then-write race from the API route)
create or replace function public.increment_view_count(p_claim_id uuid)
returns void language sql as $$
  update public.claims set view_count = view_count + 1 where id = p_claim_id;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- This is a small trusted friends/family app with no passwords, so we keep
-- policies permissive (anyone with the anon key can read/write) but still
-- turn RLS on rather than leaving tables fully open at the Postgres level.
-- ============================================================================
alter table public.users enable row level security;
alter table public.claims enable row level security;
alter table public.claim_references enable row level security;
alter table public.votes enable row level security;

drop policy if exists "public read users" on public.users;
create policy "public read users" on public.users for select using (true);
drop policy if exists "public insert users" on public.users;
create policy "public insert users" on public.users for insert with check (true);

drop policy if exists "public read claims" on public.claims;
create policy "public read claims" on public.claims for select using (true);
drop policy if exists "public insert claims" on public.claims;
create policy "public insert claims" on public.claims for insert with check (true);
drop policy if exists "public update claims" on public.claims;
create policy "public update claims" on public.claims for update using (true);

drop policy if exists "public read refs" on public.claim_references;
create policy "public read refs" on public.claim_references for select using (true);
drop policy if exists "public insert refs" on public.claim_references;
create policy "public insert refs" on public.claim_references for insert with check (true);

drop policy if exists "public read votes" on public.votes;
create policy "public read votes" on public.votes for select using (true);
drop policy if exists "public insert votes" on public.votes;
create policy "public insert votes" on public.votes for insert with check (true);
drop policy if exists "public update votes" on public.votes;
create policy "public update votes" on public.votes for update using (true);
drop policy if exists "public delete votes" on public.votes;
create policy "public delete votes" on public.votes for delete using (true);

-- ============================================================================
-- STORAGE — bucket for the audio/video recordings
-- Create the bucket first in Dashboard > Storage > "New bucket" named
-- "recordings" and mark it PUBLIC, then run the policies below.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', true)
on conflict (id) do nothing;

drop policy if exists "public read recordings" on storage.objects;
create policy "public read recordings" on storage.objects
  for select using (bucket_id = 'recordings');

drop policy if exists "public upload recordings" on storage.objects;
create policy "public upload recordings" on storage.objects
  for insert with check (bucket_id = 'recordings');
