"use client";

import { useEffect, useState } from "react";
import { TOPICS, MAX_PREFERRED_TOPICS, BROWSE_PROMPTS } from "@/lib/topics";
import { setPreferredTopics, setSkipTopicPrompt } from "@/lib/preferences";

// The calm, animated "what do you feel like browsing?" prompt shown on
// startup (unless turned off here or in Settings). Picking topics here
// soft prioritizes the feed rather than filtering it, so it never leaves
// anyone staring at an empty page.
export default function BrowsePrompt({ initialTopics, onSet, onDismiss }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [selected, setSelected] = useState(initialTopics || []);
  const [dontAsk, setDontAsk] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % BROWSE_PROMPTS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  function toggleTopic(slug) {
    setSelected((current) => {
      if (current.includes(slug)) return current.filter((s) => s !== slug);
      if (current.length >= MAX_PREFERRED_TOPICS) return current;
      return [...current, slug];
    });
  }

  function persistDontAsk() {
    if (dontAsk) setSkipTopicPrompt(true);
  }

  function handleSet() {
    setPreferredTopics(selected);
    persistDontAsk();
    onSet(selected);
  }

  function handleDismiss() {
    persistDontAsk();
    onDismiss();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6 fade-in" style={{ boxShadow: "var(--shadow-pop)" }}>
        <p key={phraseIndex} className="font-display font-bold text-2xl text-center mb-1 fade-in" style={{ minHeight: "2.2em" }}>
          {BROWSE_PROMPTS[phraseIndex]}
        </p>
        <p className="text-sm text-center mb-5" style={{ color: "var(--text-dim)" }}>
          Pick up to {MAX_PREFERRED_TOPICS} topics and we&apos;ll bring them to the front. Everything else still
          shows up too.
        </p>

        <div className="flex flex-wrap gap-2 justify-center mb-2 max-h-56 overflow-y-auto">
          {TOPICS.map((t) => {
            const active = selected.includes(t.slug);
            const disabled = !active && selected.length >= MAX_PREFERRED_TOPICS;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => toggleTopic(t.slug)}
                disabled={disabled}
                className="px-3.5 py-2 rounded-full text-sm font-medium"
                style={{
                  border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
                  background: active ? "var(--accent-soft)" : "transparent",
                  color: active ? "#d6cbff" : disabled ? "var(--text-faint)" : "var(--text-dim)",
                  opacity: disabled ? 0.45 : 1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-center mb-5" style={{ color: "var(--text-faint)" }}>
          {selected.length}/{MAX_PREFERRED_TOPICS} selected
        </p>

        <button onClick={handleSet} className="btn btn-primary w-full py-3.5 mb-2.5">
          Set
        </button>
        <button onClick={handleDismiss} className="btn btn-ghost w-full text-sm mb-4">
          Not now
        </button>

        <label className="flex items-center justify-center gap-2 text-xs" style={{ color: "var(--text-faint)" }}>
          <input
            type="checkbox"
            checked={dontAsk}
            onChange={(e) => setDontAsk(e.target.checked)}
            className="w-4 h-4"
            style={{ accentColor: "var(--accent)" }}
          />
          Don&apos;t ask me again (change this later in Settings)
        </label>
      </div>
    </div>
  );
}
