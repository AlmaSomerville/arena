# The Arena

Stake a claim. Back it up. Let the arena decide.

A tiny hobby app for friends and family: instead of typing a claim, you're
walked through a few pointed questions that force it to be specific and
debatable ("cheese is better than meat" becomes "cheese produces better
long-term cardiovascular outcomes than meat, for the average healthy adult
eating in moderation — doesn't cover people with dairy allergies"). Add
references if you've got them, record yourself making the case (up to 30
minutes, audio or video), and it posts to the feed. Anyone can reply — same
guided process, scoped to a specific part of the claim — and anyone can
upvote or downvote any claim or reply. The feed and every claim's replies
can be sorted and filtered a bunch of different ways (highest/lowest voted,
most watched, has references, by claim type, and more).

No passwords — just pick a nickname the first time you show up.

## Stack

- **Next.js** (App Router, JavaScript, Tailwind v4) — the app itself, deployed on **Vercel**
- **Supabase** — free Postgres database + file storage for the recordings

Both have generous free tiers, which is all this needs for a friends/family
group.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project (pick any name/region, and a database password — you won't need the password day-to-day).
2. Once it's ready, open **SQL Editor** in the left sidebar → **New query**.
3. Paste in the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) from this repo and click **Run**. This creates every table, the vote/reply/reference counters, and the `recordings` storage bucket + its access policies, all in one go.
4. Open **Storage** in the sidebar and confirm a bucket called `recordings` now exists and is marked **Public** (the SQL script creates it, but it's worth eyeballing).
5. Open **Settings → API**. You'll need three values from this page in the next step:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "Reveal" — keep this one secret, it bypasses all access rules)

## 2. Configure environment variables

Copy the example file and fill in the three values from above:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```

## 3. Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Recording requires
microphone (and camera, for video) permissions, which most browsers only
grant on `localhost` or `https://` — both work fine.

## 4. Push to GitHub

```bash
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/the-arena.git
git push -u origin main
```

(Create the empty repo on GitHub first if you haven't — no README/license needed there, this project already has one.)

## 5. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. In the import screen, expand **Environment Variables** and add the same three keys from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Click **Deploy**. Vercel's free (Hobby) tier is enough for this.
4. Share the resulting `*.vercel.app` URL with whoever you want testing it.

Any time you push to `main`, Vercel redeploys automatically.

## A note on the 30-minute recordings

Recordings can run up to 30 minutes, audio or video. Worth knowing before
your friends go wild with it:

- Supabase's free tier gives you **1 GB of file storage**. Audio (webm/opus)
  runs roughly 1 MB per minute, so a full 30-minute audio claim is
  ~30 MB — you can fit a few dozen of those comfortably. **Video is much
  bigger** — a 30-minute video recording can easily be 150–300 MB, which
  eats your free storage in just a handful of posts.
- If storage fills up, new recordings will fail to upload. You'd need to
  either delete old files from **Storage → recordings** in the Supabase
  dashboard, or upgrade Supabase's plan.
- If this becomes a real constraint, the easiest fix is nudging people
  toward audio by default (the recorder already defaults to audio, video is
  opt-in) or lowering `MAX_SECONDS` in `components/RecordStep.js`.

## Project structure

```
app/
  page.js                    — the main feed
  new/page.js                — the "stake a claim" wizard
  claim/[id]/page.js         — a single claim + its replies
  claim/[id]/reply/page.js   — the reply wizard
  api/                       — route handlers (claims, replies, votes, views, identity)
lib/
  claimWizard.js             — the guided question flow + sentence composer + vague-word check
  arenaNames.js              — generates each claim's fun display title
  sortOptions.js             — shared sort/filter definitions
  supabase.js                — Supabase client helpers
components/                  — UI (feed cards, vote buttons, recorder, wizard steps, etc.)
supabase/schema.sql          — the entire database schema, run once in Supabase
```

## Extending it

Some ideas if you want to keep going: edit/delete your own claims, push
notifications on new replies, a leaderboard of most-staked or
highest-scoring claimants, transcription of recordings (e.g. via a
speech-to-text API) so claims are searchable and readable, and a "featured
duel" section on the feed for whatever's getting the most action.
