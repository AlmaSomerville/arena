"use client";

import { useState } from "react";
import { fieldDef, checkVague } from "@/lib/claimWizard";

export default function StepField({ claimType, step, answers, onChange }) {
  return (
    <div>
      <h2 className="font-display font-semibold text-xl mb-4">{step.title}</h2>
      <div className="flex flex-col gap-5">
        {step.fields.map((fieldId) => (
          <Field key={fieldId} claimType={claimType} fieldId={fieldId} answers={answers} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

function Field({ claimType, fieldId, answers, onChange }) {
  const def = fieldDef(claimType, fieldId);
  if (!def) return null;

  if (def.type === "choice") {
    return (
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>
          {def.label}
        </label>
        <div className="flex gap-2">
          {def.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(fieldId, opt.value)}
              className="flex-1 rounded-xl py-3 text-center font-medium transition-colors"
              style={{
                border: `1.5px solid ${answers[fieldId] === opt.value ? "var(--accent)" : "var(--border)"}`,
                background: answers[fieldId] === opt.value ? "var(--accent-soft)" : "transparent",
                color: answers[fieldId] === opt.value ? "var(--accent-soft-text)" : "var(--text-dim)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (def.type === "list") {
    return <CaveatsField def={def} value={answers[fieldId] || []} onChange={(v) => onChange(fieldId, v)} />;
  }

  const vague = def.vagueCheck && checkVague(answers[fieldId]);

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>
        {def.label}
      </label>
      <input
        className="input"
        placeholder={def.placeholder}
        value={answers[fieldId] || ""}
        autoCapitalize={def.autoCapitalize || "none"}
        autoCorrect="off"
        onChange={(e) => onChange(fieldId, e.target.value)}
      />
      {vague && (
        <p className="text-xs mt-1.5" style={{ color: "#ffb03b" }}>
          Try to be more specific than that, it&apos;ll make for a better argument.
        </p>
      )}
    </div>
  );
}

function CaveatsField({ def, value, onChange }) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>
        {def.label}
      </label>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={def.placeholder}
          value={draft}
          autoCapitalize="none"
          autoCorrect="off"
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
        <div className="flex flex-col gap-1.5 mt-2">
          {value.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <span className="min-w-0 truncate">{c}</span>
              <button
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
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
