"use client";

import { useState } from "react";
import { checkVague } from "@/lib/claimWizard";

export default function StepField({ step, answers, onChange }) {
  const value = answers[step.key];
  const question = typeof step.question === "function" ? step.question(answers) : step.question;
  const [touched, setTouched] = useState(false);

  const vagueWarning = step.vague && touched ? checkVague(value, step.minLength) : null;

  return (
    <div className="fade-in">
      <h2 className="font-display font-semibold text-xl leading-snug mb-1.5">{question}</h2>
      {step.help && (
        <p className="text-sm mb-4" style={{ color: "var(--text-dim)" }}>
          {step.help}
        </p>
      )}
      {!step.help && <div className="mb-4" />}

      {step.type === "text" && (
        <input
          autoFocus
          className="input"
          placeholder={step.placeholder}
          maxLength={step.maxLength || 200}
          value={value || ""}
          onChange={(e) => onChange(step.key, e.target.value)}
          onBlur={() => setTouched(true)}
        />
      )}

      {step.type === "textarea" && (
        <>
          <textarea
            autoFocus
            className="input"
            rows={4}
            placeholder={step.placeholder}
            maxLength={step.maxLength || 400}
            value={value || ""}
            onChange={(e) => onChange(step.key, e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {vagueWarning && (
            <p className="text-sm mt-2 flex items-start gap-1.5" style={{ color: "#ffb03b" }}>
              <span>⚠</span> <span>{vagueWarning}</span>
            </p>
          )}
        </>
      )}

      {step.type === "radio" && (
        <div className="flex flex-col gap-2">
          {step.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(step.key, opt.value)}
              className={`btn text-left justify-start px-4 py-3.5 ${
                value === opt.value ? "btn-primary" : "btn-ghost"
              }`}
              style={{ whiteSpace: "normal", lineHeight: 1.4 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {step.type === "caveats" && <CaveatsEditor value={value || []} onChange={(v) => onChange(step.key, v)} />}
    </div>
  );
}

function CaveatsEditor({ value, onChange }) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="e.g. doesn't apply to people with allergies"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button onClick={add} className="btn btn-ghost shrink-0">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {value.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--text-dim)" }}>{c}</span>
              <button
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                style={{ color: "var(--text-faint)" }}
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
