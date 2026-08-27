"use client";

import { useState } from "react";
import Link from "next/link";
import { useIdentity } from "@/components/IdentityProvider";
import { initials } from "@/lib/identity";
import { TOPICS, MAX_PREFERRED_TOPICS } from "@/lib/topics";
import { getPreferredTopics, setPreferredTopics, getSkipTopicPrompt, setSkipTopicPrompt } from "@/lib/preferences";

export default function SettingsPage() {
  const { user, requireIdentity } = useIdentity();

  // Seeded from localStorage via lazy initializers rather than an effect —
  // this is a one-time read of an external value at mount, not a
  // subscription, and the app never server-renders this page for a real
  // visitor (it's always behind the identity gate below on first load).
  const [topics, setTopics] = useState(() => getPreferredTopics());
  const [askEveryTime, setAskEveryTime] = useState(() => !getSkipTopicPrompt());
  const [saved, setSaved] = useState(false);

  function toggleTopic(slug) {
    setSaved(false);
    setTopics((current) => {
      if (current.includes(slug)) return current.filter((s) => s !== slug);
      if (current.length >= MAX_PREFERRED_TOPICS) return current;
      return [...current, slug];
    });
  }

  function persist(nextTopics, nextAskEveryTime) {
    setPreferredTopics(nextTopics);
    setSkipTopicPrompt(!nextAskEveryTime);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) {
    return (
      <div className="card p-8 text-center mt-6">
        <p className="mb-4" style={{ color: "var(--text-dim)" }}>
          Join the arena to see your settings.
        </p>
        <button onClick={() => requireIdentity("Pick a nickname to continue.")} className="btn btn-primary">
          Join the arena
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl mb-1.5">Settings</h1>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          Your identity, your Rep, and what you like to browse.
        </p>
      </div>

      <div className="card p-5 mb-6 flex items-center gap-4">
        <span
          className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg shrink-0"
          style={{ background: user.avatar_color, color: "#0b0b12" }}
        >
          {initials(user.nickname)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-lg truncate">{user.nickname}</p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            No password — just this nickname
          </p>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Rep
          </p>
          <span className="badge" style={{ background: "var(--accent-soft)", color: "#d6cbff" }}>
            Bit like Reddit Karma
          </span>
        </div>
        <p className="font-display font-bold text-4xl tabular-nums mb-1">{user.rep ?? 0}</p>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>
          +1 for every argument you watch through to the end. Simple for now — the rules may get richer later.
        </p>
      </div>

      <div className="card p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-faint)" }}>
          What you feel like browsing
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
          Pick up to {MAX_PREFERRED_TOPICS}. Your feed still shows everything — these just get bumped to the front.
        </p>
        <div className="flex flex-wrap gap-2 mb-1">
          {TOPICS.map((t) => {
            const active = topics.includes(t.slug);
            const disabled = !active && topics.length >= MAX_PREFERRED_TOPICS;
            return (
              <button
                key={t.slug}
                onClick={() => toggleTopic(t.slug)}
                disabled={disabled}
                className="px-3.5 py-2 rounded-full text-sm font-medium transition-colors"
                style={{
                  border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "#d6cbff" : disabled ? "var(--text-faint)" : "var(--text-dim)",
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
          {topics.length}/{MAX_PREFERRED_TOPICS} selected
        </p>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium mb-0.5">Ask me every time I open the app</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Turn this off to skip the &quot;what do you feel like browsing?&quot; prompt on startup.
            </p>
          </div>
          <Toggle checked={askEveryTime} onChange={setAskEveryTime} />
        </div>
      </div>

      <button
        onClick={() => persist(topics, askEveryTime)}
        className="btn btn-primary w-full py-3.5 mb-3"
      >
        {saved ? "Saved ✓" : "Save preferences"}
      </button>

      <Link href="/" className="btn btn-ghost w-full text-center py-3">
        Back to feed
      </Link>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-12 h-7 rounded-full flex items-center px-0.5 transition-colors shrink-0"
      style={{ background: checked ? "var(--accent)" : "rgba(255,255,255,0.12)" }}
      aria-pressed={checked}
      aria-label="Toggle ask every time"
    >
      <span
        className="w-6 h-6 rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}
