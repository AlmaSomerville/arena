# The Arena

Stake a claim. Back it up. Let the arena decide.

Made this for me and my friends/family to argue on properly instead of in a group chat where everything gets lost after 10 messages. Instead of just typing a claim, it walks you through a few questions to make you actually be specific about what you're arguing (no more "cats are just better" - what does "better" even mean), you pick a topic, chuck in some links if you've got receipts, and record yourself making the case, audio or video, up to 30 min.

People reply For, Against, or Nuance. Once you pick For or Against on something you're locked to that side for good (you can still watch the other side's stuff, just can't vote on their replies - stops people ganging up and downvoting the other team into oblivion). Nuance replies are open season for everyone regardless of side. Watch a video the whole way through and you get a point of Rep (shows up in Settings), plus it pops up a For/Against/Nuance thing right on the video so you can react immediately instead of having to scroll down and find the buttons.

No passwords, just pick a nickname the first time and you're in.

## stack

Next.js + Tailwind on the frontend, Supabase doing the database and file storage for recordings. Deployed on Vercel. All free tier, which is plenty for a friends group unless you've got like 500 friends who all record 30 min videos, in which case, good for you I guess.

## setting it up

You'll need a Supabase account and a Vercel account, both free.

**Supabase first:**

1. Go make an account at supabase.com and start a new project (name/region don't matter, just remember the DB password even though you probably won't need it again)
2. Once it spins up, go to SQL Editor > New query, and paste in everything from `supabase/schema.sql` in this repo. Hit run. This sets up all the tables, the vote counters, the topic list, storage bucket, all of it in one shot. It's safe to re-run this later too if I push updates to the schema, it won't nuke your existing data.
3. Check Storage in the sidebar, there should be a `recordings` bucket and it should say Public.
4. Go to Settings > API and grab three things - the Project URL, the anon public key, and the service_role key (you have to click reveal for that last one, and don't put that one anywhere public, it skips all the security rules)

**Then locally:**

```
cp .env.local.example .env.local
```

and fill in those 3 values in there. Then:

```
npm install
npm run dev
```

localhost:3000 and you're good. Heads up, recording needs mic/camera permission which browsers only allow on localhost or a real https site, so this is fine either way.

**Getting it online:**

Push the repo to GitHub, then go to vercel.com/new and import it. When it asks, add the same 3 env vars from your .env.local. Deploy. It'll give you a vercel.app link, send that to whoever. Every time you push to main it redeploys on its own after that.

## heads up about the 30 min recordings

Supabase's free storage is 1GB. Audio recordings are small, maybe a MB a minute so a full 30 min audio post is like 30MB, no big deal. Video is a totally different story though, a 30 min video can be 150-300MB easily, so you'll chew through free storage way faster if people go video-heavy. If it fills up, uploads just start failing until you clear old stuff out of Storage in the Supabase dashboard (or pay them). If this actually becomes a problem, easiest fix is just nudging people to audio (it already defaults to audio, video's opt in) or turning down the max recording length in the record component.

## what's in here

- `app/` - pages, mainly the feed, the posting wizard, the argument detail page, settings
- `app/api/` - the backend routes (claims, votes, replies, etc)
- `lib/` - the wizard logic, topic list, sort/filter stuff, supabase client
- `components/` - the recorder, the video player w/ the forced watch + overlay, feed cards, nav, etc
- `supabase/schema.sql` - the whole db schema, re-runnable any time

## random ideas if someone wants to keep building on this

edit/delete your own posts (currently can't, oops), notifications when someone replies to you, a leaderboard for Rep, maybe transcribing recordings so you can actually search/read old arguments instead of rewatching a 20 min video to remember what someone said, a "hot right now" spot on the feed for whatever's getting the most replies.
