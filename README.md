# The Arena

Stake a claim. Back it up. Let the arena decide.

A tiny hobby app for friends and family: post an argument — a short title,
a topic, and a recording (up to 30 minutes, audio or video) making your
case, with as many references as you want to back it up. Anyone can reply
**For**, **Against**, or with a **Nuance** — For/Against locks you to that
side of the argument permanently (you can still watch the other side, you
just can't vote on its replies, which keeps malicious pile-on downvoting
out of the picture), while Nuance stays open to everyone regardless of
side. Every root argument shows a live For/Against split; every claim's
replies can be sorted and filtered a bunch of different ways
(highest/lowest voted, most watched, has references, and more). Watching a
video through to the end earns you a point of Rep — visible in Settings,
a bit like Reddit Karma.

No passwords — just pick a nickname the first time you show up.

## Stack

- **Next.js** (App Router, JavaScript, Tailwind v4) — the app itself, deployed on **Vercel**
- **Supabase** — free Postgres database + file storage for the recordings

Both have generous free tiers, which is all this needs for a friends/family
group.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project (pick any name/region, and a database password — you won't need the password day-to-day).
2. Once it's ready, open **SQL Editor** in the left sidebar → **New query**.
3. Paste in the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) from this repo and click **Run**. This creates every table, the vote/reply/reference/side-pick/rep counters, the fixed topic list, and the `recordings` storage bucket + its access policies, all in one go. The whole file is safe to re-run any time — if you'd already set up an earlier version of The Arena, just re-paste and re-run the updated file and it'll add the new pieces (topics, For/Against side-locking, Rep) without touching your existing data.
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
  page.js                     — the main feed
  new/page.js                 — the "stake a claim" posting flow (title + topic + references + recording)
  claim/[id]/page.js          — a single argument: pick a side, watch, browse replies
  claim/[id]/reply/page.js    — the reply flow (For / Against / Nuance + recording)
  settings/page.js            — nickname, Rep, preferred topics, browse-prompt toggle
  api/                        — route handlers (claims, replies, votes, views, identity,
                                 topics, argument-sides, watch-complete)
lib/
  topics.js                   — the fixed topic list + rotating browse-prompt phrasings
  preferences.js              — localStorage helpers for preferred topics / prompt opt-out
  text.js                     — small text helper (capitalize first letter)
  sortOptions.js               — shared sort/filter definitions
  supabase.js                  — Supabase client helpers
components/                   — UI (feed cards, vote buttons, recorder, posting-flow shell, etc.)
supabase/schema.sql            — the entire database schema (idempotent — safe to re-run)
```

## What's built vs. what's next

This is **Phase 1** of a structural redesign (data model, posting/reply
flows, side-locked voting, and Rep are all live). A few pieces from the
fuller vision are intentionally deferred so each phase ships as a working
increment:

- **Phase 2** — a custom video player that disables forward-scrubbing and
  shows a persistent For/Against/Nuance overlay right as a video ends
  (wired to `/api/watch-complete` and `/api/argument-sides`, both already
  built). Right now, picking a side happens via buttons on the claim page
  instead of an end-of-video overlay.
- **Phase 3** — a YouTube-style scrollable feed (thumbnail left, details
  right) in place of the current card feed.
- **Phase 4** — the startup "What do you feel like browsing?" prompt with
  rotating phrasings and a topic picker. Settings already lets you set
  preferred topics and the ask-me-again toggle by hand in the meantime —
  the feed already soft-prioritizes by them via `/api/claims?preferred=`.

## Extending it

Some ideas if you want to keep going, beyond the phases above: edit/delete
your own claims, push notifications on new replies, a leaderboard by Rep,
transcription of recordings (e.g. via a speech-to-text API) so arguments
are searchable and readable, and a "featured duel" section on the feed for
whatever's getting the most action.
