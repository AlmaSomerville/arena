"use client";

import { useState } from "react";

export default function ReferencesEditor({ references, onChange }) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  function add() {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setError("That doesn't look like a valid URL (include https://).");
      return;
    }
    setError("");
    onChange([...references, { url: trimmed, label: label.trim() }]);
    setUrl("");
    setLabel("");
  }

  return (
    <div>
      <h2 className="font-display font-semibold text-xl mb-1.5">Back it up (optional)</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
        Add as many references as you like — studies, articles, anything. Or none at all.
      </p>

      <div className="flex flex-col gap-2 mb-2">
        <input
          className="input"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button onClick={add} className="btn btn-ghost shrink-0">
            Add reference
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm mb-2" style={{ color: "var(--down)" }}>
          {error}
        </p>
      )}

      {references.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {references.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{r.label || r.url}</p>
                {r.label && (
                  <p className="truncate text-xs" style={{ color: "var(--text-faint)" }}>
                    {r.url}
                  </p>
                )}
              </div>
              <button
                onClick={() => onChange(references.filter((_, idx) => idx !== i))}
                style={{ color: "var(--text-faint)" }}
                className="shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
