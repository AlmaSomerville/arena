"use client";

import { useMemo, useState } from "react";
import { useIdentity } from "@/components/IdentityProvider";

export default function VoteButtons({ claim, size = "md" }) {
  const { user, requireIdentity } = useIdentity();
  const [score, setScore] = useState(claim.score ?? 0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const initialVote = useMemo(() => {
    if (!user || !claim.votes) return 0;
    const mine = claim.votes.find((v) => v.user_id === user.id);
    return mine ? mine.value : 0;
  }, [claim.votes, user]);

  const [myVote, setMyVote] = useState(initialVote);

  async function vote(value) {
    if (busy) return;
    const activeUser = user || (await requireIdentity("Pick a nickname to vote."));
    if (!activeUser) return;

    setNotice("");
    const prevVote = myVote;
    const prevScore = score;
    const nextVote = prevVote === value ? 0 : value;
    const delta = nextVote - prevVote;
    setMyVote(nextVote);
    setScore(prevScore + delta);
    setBusy(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: claim.id, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScore(data.claim.score);
      setMyVote(data.myVote);
    } catch (err) {
      setMyVote(prevVote);
      setScore(prevScore);
      // Most commonly a 403 from the vote-numbing rule (you're on the other
      // side of this argument) - surface it briefly instead of failing silently.
      if (err.message) {
        setNotice(err.message);
        setTimeout(() => setNotice(""), 3500);
      }
    } finally {
      setBusy(false);
    }
  }

  const dim = size === "lg" ? "w-10 h-10 text-lg" : "w-8 h-8 text-base";

  return (
    <div className="relative select-none">
      {notice && (
        <div
          className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap fade-in z-10"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          {notice}
        </div>
      )}
      <div className="flex items-center gap-1.5">
      <button
        aria-label="Upvote"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          vote(1);
        }}
        className={`${dim} rounded-full flex items-center justify-center transition-colors`}
        style={{
          background: myVote === 1 ? "var(--up-soft)" : "rgba(255,255,255,0.05)",
          color: myVote === 1 ? "var(--up)" : "var(--text-dim)",
          border: `1px solid ${myVote === 1 ? "rgba(34,199,181,0.5)" : "var(--border)"}`,
        }}
      >
        ▲
      </button>
      <span
        className="min-w-[2ch] text-center font-display font-bold tabular-nums text-sm"
        style={{ color: score > 0 ? "var(--up)" : score < 0 ? "var(--down)" : "var(--text-dim)" }}
      >
        {score}
      </span>
      <button
        aria-label="Downvote"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          vote(-1);
        }}
        className={`${dim} rounded-full flex items-center justify-center transition-colors`}
        style={{
          background: myVote === -1 ? "var(--down-soft)" : "rgba(255,255,255,0.05)",
          color: myVote === -1 ? "var(--down)" : "var(--text-dim)",
          border: `1px solid ${myVote === -1 ? "rgba(255,92,106,0.5)" : "var(--border)"}`,
        }}
      >
        ▼
      </button>
      </div>
    </div>
  );
}
